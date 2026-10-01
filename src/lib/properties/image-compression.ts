/**
 * Client-side photo compression before upload (feature 16 T4). Phone photos
 * are 4-12 MB; the 15 MB limit and the 30 GB disk make it worth shrinking
 * them in the browser: long edge at most 2560px, WebP (JPEG as fallback) at
 * quality 0.85, EXIF orientation applied. Files already under ~1.5 MB are
 * left alone and a result that is not smaller than the original is dropped.
 * Everything that touches the browser sits behind `CompressionDeps`, so the
 * decision logic is unit-testable.
 */
export const MAX_LONG_EDGE = 2560;
export const COMPRESSION_QUALITY = 0.85;
export const SKIP_COMPRESSION_BELOW_BYTES = 1.5 * 1024 * 1024;

export type Size = { width: number; height: number };

/** Target dimensions: never upscale; the long edge is capped at `MAX_LONG_EDGE`. */
export function computeTargetSize(size: Size, maxEdge = MAX_LONG_EDGE): Size {
  const longEdge = Math.max(size.width, size.height);
  if (longEdge <= maxEdge) return { width: size.width, height: size.height };
  const scale = maxEdge / longEdge;
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}

export function shouldCompress(bytes: number): boolean {
  return bytes >= SKIP_COMPRESSION_BELOW_BYTES;
}

const EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
};

/** Same base name with the extension of the output type. */
export function outputFileName(name: string, type: string): string {
  const extension = EXTENSIONS[type] ?? "jpg";
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.${extension}`;
}

export type DecodedImage = Size & { close?: () => void };

export type CompressionDeps = {
  isSupported: () => boolean;
  decode: (file: File) => Promise<DecodedImage>;
  encode: (
    image: DecodedImage,
    size: Size,
    type: string,
    quality: number,
  ) => Promise<Blob | null>;
};

/**
 * Returns a smaller `File` when compressing helps, otherwise the original.
 * Never throws: any failure (unsupported browser, corrupt image, memory)
 * falls back to the original so the upload can still be attempted.
 */
export async function compressImage(
  file: File,
  deps: CompressionDeps = browserDeps,
): Promise<File> {
  if (!shouldCompress(file.size) || !deps.isSupported()) return file;

  let image: DecodedImage | undefined;
  try {
    image = await deps.decode(file);
    const size = computeTargetSize(image);
    for (const type of ["image/webp", "image/jpeg"]) {
      const blob = await deps.encode(image, size, type, COMPRESSION_QUALITY);
      // Browsers silently answer PNG when they cannot encode the requested type.
      if (!blob || blob.type !== type) continue;
      if (blob.size >= file.size) return file;
      return new File([blob], outputFileName(file.name, type), {
        type,
        lastModified: file.lastModified,
      });
    }
    return file;
  } catch {
    return file;
  } finally {
    image?.close?.();
  }
}

const browserDeps: CompressionDeps = {
  isSupported: () =>
    typeof createImageBitmap === "function" && typeof document !== "undefined",
  // `from-image` applies the EXIF orientation, so portrait phone photos stay upright.
  decode: (file) => createImageBitmap(file, { imageOrientation: "from-image" }),
  encode: async (image, size, type, quality) => {
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(image as ImageBitmap, 0, 0, size.width, size.height);
    return new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, quality),
    );
  },
};

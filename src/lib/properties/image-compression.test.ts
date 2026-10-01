import { describe, expect, it, vi } from "vitest";
import {
  COMPRESSION_QUALITY,
  MAX_LONG_EDGE,
  SKIP_COMPRESSION_BELOW_BYTES,
  compressImage,
  computeTargetSize,
  outputFileName,
  shouldCompress,
  type CompressionDeps,
} from "./image-compression";

function fileOf(name: string, type: string, size: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("computeTargetSize", () => {
  it("keeps images whose long edge already fits", () => {
    expect(computeTargetSize({ width: 2000, height: 1500 })).toEqual({
      width: 2000,
      height: 1500,
    });
    expect(computeTargetSize({ width: MAX_LONG_EDGE, height: 100 })).toEqual({
      width: MAX_LONG_EDGE,
      height: 100,
    });
  });

  it("scales a landscape image so the width is 2560px, keeping the aspect ratio", () => {
    expect(computeTargetSize({ width: 5120, height: 3840 })).toEqual({
      width: 2560,
      height: 1920,
    });
  });

  it("scales a portrait image by its height", () => {
    expect(computeTargetSize({ width: 3024, height: 4032 })).toEqual({
      width: 1920,
      height: 2560,
    });
  });

  it("rounds to whole pixels and never goes below 1px", () => {
    expect(computeTargetSize({ width: 5001, height: 3333 })).toEqual({
      width: 2560,
      height: Math.round((3333 * 2560) / 5001),
    });
    expect(computeTargetSize({ width: 100000, height: 10 })).toEqual({
      width: 2560,
      height: 1,
    });
  });
});

describe("shouldCompress", () => {
  it("skips files already under ~1.5 MB", () => {
    expect(shouldCompress(1000)).toBe(false);
    expect(shouldCompress(SKIP_COMPRESSION_BELOW_BYTES - 1)).toBe(false);
  });

  it("compresses bigger files", () => {
    expect(shouldCompress(SKIP_COMPRESSION_BELOW_BYTES)).toBe(true);
    expect(shouldCompress(12 * 1024 * 1024)).toBe(true);
  });
});

describe("outputFileName", () => {
  it("swaps the extension for the output type", () => {
    expect(outputFileName("living.JPG", "image/webp")).toBe("living.webp");
    expect(outputFileName("foto.final.png", "image/jpeg")).toBe("foto.final.jpg");
    expect(outputFileName("sin-extension", "image/webp")).toBe("sin-extension.webp");
  });
});

describe("compressImage", () => {
  const BIG = 6 * 1024 * 1024;

  function deps(overrides: Partial<CompressionDeps> = {}): CompressionDeps {
    return {
      isSupported: () => true,
      decode: vi.fn(async () => ({ width: 4000, height: 3000, close: vi.fn() })),
      encode: vi.fn(async (_bitmap, _size, type) => {
        const blob = new Blob(["y"], { type });
        Object.defineProperty(blob, "size", { value: 400_000 });
        return blob;
      }),
      ...overrides,
    };
  }

  it("returns the original file when it is already small", async () => {
    const file = fileOf("a.jpg", "image/jpeg", 100_000);
    const d = deps();

    expect(await compressImage(file, d)).toBe(file);
    expect(d.decode).not.toHaveBeenCalled();
  });

  it("returns the original when the browser cannot decode or encode", async () => {
    const file = fileOf("a.jpg", "image/jpeg", BIG);

    expect(await compressImage(file, deps({ isSupported: () => false }))).toBe(file);
  });

  it("resizes to 2560px and encodes WebP at the configured quality", async () => {
    const file = fileOf("a.jpg", "image/jpeg", BIG);
    const d = deps();

    const result = await compressImage(file, d);

    expect(d.decode).toHaveBeenCalledWith(file);
    expect(d.encode).toHaveBeenCalledWith(
      expect.anything(),
      { width: 2560, height: 1920 },
      "image/webp",
      COMPRESSION_QUALITY,
    );
    expect(result).not.toBe(file);
    expect(result.name).toBe("a.webp");
    expect(result.type).toBe("image/webp");
  });

  it("falls back to JPEG when WebP encoding is not honoured", async () => {
    const file = fileOf("a.png", "image/png", BIG);
    const encode = vi
      .fn()
      .mockResolvedValueOnce(new Blob(["p"], { type: "image/png" }))
      .mockResolvedValueOnce(new Blob(["j"], { type: "image/jpeg" }));

    const result = await compressImage(file, deps({ encode }));

    expect(encode.mock.calls[1][2]).toBe("image/jpeg");
    expect(result.type).toBe("image/jpeg");
    expect(result.name).toBe("a.jpg");
  });

  it("keeps the original when compression does not make it smaller", async () => {
    const file = fileOf("a.jpg", "image/jpeg", BIG);
    const encode = vi.fn(async (_b: unknown, _size: unknown, type: string) => {
      const blob = new Blob(["z"], { type });
      Object.defineProperty(blob, "size", { value: BIG + 1 });
      return blob;
    });

    expect(await compressImage(file, deps({ encode }))).toBe(file);
  });

  it("returns the original when decoding fails (e.g. a corrupt image)", async () => {
    const file = fileOf("a.jpg", "image/jpeg", BIG);

    const result = await compressImage(
      file,
      deps({
        decode: vi.fn(async () => {
          throw new Error("bad image");
        }),
      }),
    );

    expect(result).toBe(file);
  });

  it("releases the decoded bitmap", async () => {
    const close = vi.fn();
    const file = fileOf("a.jpg", "image/jpeg", BIG);

    await compressImage(
      file,
      deps({ decode: vi.fn(async () => ({ width: 4000, height: 3000, close })) }),
    );

    expect(close).toHaveBeenCalled();
  });
});

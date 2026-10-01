/** Photo rules shared by the images manager and its Server Actions (mirror the back's limits). */
export const MAX_IMAGES_PER_PROPERTY = 30;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
/** Biggest original the browser accepts to pick: it is compressed before upload, so it may exceed 15 MB. */
export const MAX_ORIGINAL_BYTES = 60 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Returns a Spanish error for a file the back would reject, or `null` when it looks fine. */
export function validateImageFile(file: Pick<File, "type" | "size">): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Formato no soportado: usá fotos JPG, PNG o WebP.";
  }
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > MAX_IMAGE_BYTES) return "La foto supera los 15 MB.";
  return null;
}

/** Moves the item at `index` one step (`delta` = -1 earlier, +1 later); out-of-range moves are no-ops. */
export function moveItem<T>(items: readonly T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  const next = [...items];
  if (target < 0 || target >= items.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Moves the item at `index` to the first position, which the site uses as the cover. */
export function moveToFront<T>(items: readonly T[], index: number): T[] {
  const next = [...items];
  const [item] = next.splice(index, 1);
  return [item, ...next];
}

/**
 * Checks a freshly picked photo before compressing it: format and a sane
 * original size. The 15 MB limit is checked again on the compressed file
 * (`validateImageFile`), since compression usually brings a big photo under it.
 */
export function validatePickedImage(file: Pick<File, "type" | "size">): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Formato no soportado: usá fotos JPG, PNG o WebP.";
  }
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > MAX_ORIGINAL_BYTES) return "La foto es demasiado pesada (más de 60 MB).";
  return null;
}

/**
 * New order after dragging `activeId` onto `overId` (the dragged item takes
 * the drop target's position). Returns the same array when nothing changes.
 */
export function reorderByIds<T extends { id: string }>(
  items: T[],
  activeId: string,
  overId: string | null | undefined,
): T[] {
  if (!overId || activeId === overId) return items;
  const from = items.findIndex((item) => item.id === activeId);
  const to = items.findIndex((item) => item.id === overId);
  if (from < 0 || to < 0) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

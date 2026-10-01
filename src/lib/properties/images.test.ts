import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_BYTES,
  MAX_ORIGINAL_BYTES,
  moveItem,
  moveToFront,
  reorderByIds,
  validateImageFile,
  validatePickedImage,
} from "./images";

function fileOf(type: string, size: number): File {
  const file = new File(["x"], "foto", { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateImageFile", () => {
  it("accepts JPEG, PNG and WebP up to 15 MB", () => {
    expect(validateImageFile(fileOf("image/jpeg", 1000))).toBeNull();
    expect(validateImageFile(fileOf("image/png", MAX_IMAGE_BYTES))).toBeNull();
    expect(validateImageFile(fileOf("image/webp", 1000))).toBeNull();
  });

  it("rejects other formats", () => {
    expect(validateImageFile(fileOf("image/heic", 1000))).toMatch(/JPG, PNG o WebP/);
  });

  it("rejects files over 15 MB", () => {
    expect(validateImageFile(fileOf("image/jpeg", MAX_IMAGE_BYTES + 1))).toMatch(/15 MB/);
  });

  it("rejects empty files", () => {
    expect(validateImageFile(fileOf("image/jpeg", 0))).toMatch(/vacío/);
  });
});

describe("moveItem", () => {
  it("swaps an item with its neighbour", () => {
    expect(moveItem(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
  });

  it("returns the same order when the move falls outside the list", () => {
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });
});

describe("moveToFront", () => {
  it("moves an item to the first position (the cover)", () => {
    expect(moveToFront(["a", "b", "c"], 2)).toEqual(["c", "a", "b"]);
  });
});

describe("reorderByIds", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

  it("moves the dragged item to the position of the one it was dropped on", () => {
    expect(reorderByIds(items, "a", "c").map((i) => i.id)).toEqual(["b", "c", "a", "d"]);
    expect(reorderByIds(items, "d", "a").map((i) => i.id)).toEqual(["d", "a", "b", "c"]);
  });

  it("returns the same order when dropped on itself, outside, or on unknown ids", () => {
    expect(reorderByIds(items, "b", "b")).toBe(items);
    expect(reorderByIds(items, "b", null)).toBe(items);
    expect(reorderByIds(items, "x", "a")).toBe(items);
    expect(reorderByIds(items, "a", "x")).toBe(items);
  });
});

describe("validatePickedImage", () => {
  it("accepts any size up to the original cap, because it is compressed before upload", () => {
    expect(validatePickedImage(fileOf("image/jpeg", MAX_IMAGE_BYTES + 1))).toBeNull();
    expect(validatePickedImage(fileOf("image/png", MAX_ORIGINAL_BYTES))).toBeNull();
  });

  it("rejects unsupported formats, empty files and absurdly large originals", () => {
    expect(validatePickedImage(fileOf("application/pdf", 10))).toMatch(/JPG, PNG o WebP/);
    expect(validatePickedImage(fileOf("image/jpeg", 0))).toMatch(/vacío/);
    expect(validatePickedImage(fileOf("image/jpeg", MAX_ORIGINAL_BYTES + 1))).toMatch(/demasiado pesada/);
  });
});

import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_BYTES,
  moveItem,
  moveToFront,
  validateImageFile,
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

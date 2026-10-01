import { describe, expect, it } from "vitest";
import { makeProperty } from "@/test/fixtures/property";
import {
  canDeleteProperty,
  dealStatusOptions,
  publicationTransitions,
} from "./lifecycle";

describe("publicationTransitions", () => {
  it("offers publish and archive for a draft", () => {
    expect(publicationTransitions("draft").map((t) => t.transition)).toEqual([
      "publish",
      "archive",
    ]);
  });

  it("offers unpublish and archive for a published property", () => {
    expect(publicationTransitions("published").map((t) => t.transition)).toEqual([
      "unpublish",
      "archive",
    ]);
  });

  it("offers publish and unpublish for an archived property", () => {
    expect(publicationTransitions("archived").map((t) => t.transition)).toEqual([
      "publish",
      "unpublish",
    ]);
  });

  it("labels each transition in Spanish", () => {
    expect(publicationTransitions("draft")[0].label).toBe("Publicar");
  });
});

describe("dealStatusOptions", () => {
  it("restricts the options to the operation", () => {
    expect(dealStatusOptions("sale", "available").map((o) => o.value)).toEqual([
      "available",
      "reserved",
      "sold",
    ]);
    expect(dealStatusOptions("rent", "available").map((o) => o.value)).toEqual([
      "available",
      "reserved",
      "rented",
    ]);
  });

  it("keeps an out-of-rule current status visible so the select reflects reality", () => {
    expect(dealStatusOptions("rent", "sold").map((o) => o.value)).toEqual([
      "available",
      "reserved",
      "rented",
      "sold",
    ]);
  });
});

describe("canDeleteProperty", () => {
  it("allows only admins to delete never-published properties", () => {
    const draft = makeProperty({ firstPublishedAt: null });
    const published = makeProperty({ firstPublishedAt: "2024-02-01" });

    expect(canDeleteProperty(["admin"], draft)).toBe(true);
    expect(canDeleteProperty(["manager"], draft)).toBe(false);
    expect(canDeleteProperty(["admin"], published)).toBe(false);
  });
});

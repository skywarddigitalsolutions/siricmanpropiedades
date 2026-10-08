import { describe, expect, it } from "vitest";
import { LEAD_CATEGORIES, LEAD_CATEGORY_LABELS, leadCategory } from "./category";

describe("leadCategory", () => {
  it.each([
    [{ type: "appraisal", topic: null }, "appraisal"],
    [{ type: "appraisal", topic: "sell" }, "appraisal"],
    [{ type: "property_inquiry", topic: null }, "search"],
    [{ type: "contact", topic: "buy" }, "search"],
    [{ type: "contact", topic: "rent" }, "search"],
    [{ type: "contact", topic: "rental_management" }, "management"],
    [{ type: "contact", topic: "consortium" }, "management"],
    [{ type: "contact", topic: "sell" }, "other"],
    [{ type: "contact", topic: "other" }, "other"],
    [{ type: "contact", topic: null }, "other"],
    [{ type: "contact" }, "other"],
  ] as const)("%j is %s", (lead, category) => {
    expect(leadCategory(lead)).toBe(category);
  });
});

describe("LEAD_CATEGORIES", () => {
  it("lists every category with its Spanish label", () => {
    expect(LEAD_CATEGORIES).toEqual(["appraisal", "search", "management", "other"]);
    expect(LEAD_CATEGORY_LABELS).toEqual({
      appraisal: "Tasaciones",
      search: "Compra y alquiler",
      management: "Administración",
      other: "Otras",
    });
  });
});

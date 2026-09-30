import { describe, expect, it } from "vitest";
import { canAccessPanel } from "./roles";

describe("canAccessPanel", () => {
  it("allows an admin role", () => {
    expect(canAccessPanel(["admin"])).toBe(true);
  });

  it("allows a manager role", () => {
    expect(canAccessPanel(["manager"])).toBe(true);
  });

  it("allows an account holding both admin and manager", () => {
    expect(canAccessPanel(["admin", "manager"])).toBe(true);
  });

  it("denies a plain user role", () => {
    expect(canAccessPanel(["user"])).toBe(false);
  });

  it("denies an empty role list", () => {
    expect(canAccessPanel([])).toBe(false);
  });

  it("denies an unknown role", () => {
    expect(canAccessPanel(["superadmin"])).toBe(false);
  });

  it("allows a manager role mixed with an unrelated unknown role", () => {
    expect(canAccessPanel(["unknown", "manager"])).toBe(true);
  });
});

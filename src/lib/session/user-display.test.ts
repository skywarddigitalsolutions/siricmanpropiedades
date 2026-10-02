import { describe, expect, it } from "vitest";
import { initialsOf, roleLabel } from "./user-display";

describe("initialsOf", () => {
  it("uses the first letter of a single word", () => {
    expect(initialsOf("gabriel")).toBe("G");
  });

  it("uses two initials for separated names", () => {
    expect(initialsOf("maria.lopez")).toBe("ML");
    expect(initialsOf("juan perez gomez")).toBe("JP");
    expect(initialsOf("ana_sosa")).toBe("AS");
  });

  it("returns an empty string when there is nothing to show", () => {
    expect(initialsOf("  ")).toBe("");
    expect(initialsOf("...")).toBe("");
  });
});

describe("roleLabel", () => {
  it("shows the most privileged role in Spanish", () => {
    expect(roleLabel(["user", "admin"])).toBe("Administrador");
    expect(roleLabel(["manager"])).toBe("Gerente");
    expect(roleLabel(["user"])).toBe("Usuario");
  });

  it("falls back to an empty label with no known role", () => {
    expect(roleLabel([])).toBe("");
  });
});

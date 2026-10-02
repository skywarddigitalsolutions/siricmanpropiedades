import { describe, expect, it } from "vitest";
import { PASSWORD_HINT, passwordPolicyError } from "./password-policy";

describe("passwordPolicyError", () => {
  it("accepts 6-50 characters with upper, lower and a number", () => {
    expect(passwordPolicyError("Abcde1")).toBeUndefined();
    expect(passwordPolicyError("Abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMN")).toBeUndefined();
  });

  it("accepts a symbol in place of a number, like the back does", () => {
    expect(passwordPolicyError("Abcde!")).toBeUndefined();
  });

  it("rejects short and long passwords", () => {
    expect(passwordPolicyError("Ab1de")).toMatch(/entre 6 y 50/);
    expect(passwordPolicyError("A1" + "b".repeat(49))).toMatch(/entre 6 y 50/);
  });

  it("rejects missing uppercase, lowercase or number", () => {
    expect(passwordPolicyError("abcde1")).toMatch(/mayúscula/);
    expect(passwordPolicyError("ABCDE1")).toMatch(/mayúscula/);
    expect(passwordPolicyError("Abcdef")).toMatch(/número/);
  });

  it("exposes the hint shown next to the fields", () => {
    expect(PASSWORD_HINT).toBe("De 6 a 50 caracteres, con mayúscula, minúscula y número.");
  });
});

// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { RedirectError, expectRedirect } from "@/test/next-server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

import { ApiError } from "@/lib/api/client";
import { handleSessionError } from "./session-error";

describe("handleSessionError", () => {
  it("redirects to /admin/login?reason=expired on a 401 ApiError", async () => {
    await expectRedirect(
      Promise.resolve().then(() =>
        handleSessionError(new ApiError(401, "Invalid or expired token")),
      ),
      "/admin/login?reason=expired",
    );
  });

  it("rethrows a non-401 ApiError", () => {
    const error = new ApiError(400, "Bad request");
    expect(() => handleSessionError(error)).toThrow(error);
  });

  it("rethrows a non-ApiError value", () => {
    const error = new Error("boom");
    expect(() => handleSessionError(error)).toThrow(error);
  });
});

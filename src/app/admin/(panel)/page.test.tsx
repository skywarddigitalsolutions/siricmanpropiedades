// @vitest-environment node
import { describe, it, vi } from "vitest";
import { RedirectError, expectRedirect } from "@/test/next-server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

import AdminPanelPage from "./page";

describe("AdminPanelPage", () => {
  it("redirects to /admin/propiedades", async () => {
    await expectRedirect(AdminPanelPage(), "/admin/propiedades");
  });
});

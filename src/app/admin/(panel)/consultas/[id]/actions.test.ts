// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectRedirect, RedirectError } from "@/test/next-server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

const { updateLead, deleteLead } = vi.hoisted(() => ({
  updateLead: vi.fn(),
  deleteLead: vi.fn(),
}));
vi.mock("@/lib/api/leads", () => ({ updateLead, deleteLead }));

const { getSessionToken } = vi.hoisted(() => ({ getSessionToken: vi.fn() }));
vi.mock("@/lib/session/dal", () => ({ getSessionToken }));

import { ApiError } from "@/lib/api/client";
import { deleteLeadAction, updateLeadAction } from "./actions";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionToken.mockResolvedValue("jwt");
  updateLead.mockResolvedValue({ id: "l1" });
  deleteLead.mockResolvedValue(undefined);
});

describe("updateLeadAction", () => {
  it("saves status and notes and refreshes the inbox and the nav badge", async () => {
    const state = await updateLeadAction(
      "l1",
      {},
      form({ status: "contacted", notes: " Llamé, vuelve el lunes " }),
    );

    expect(updateLead).toHaveBeenCalledWith("jwt", "l1", {
      status: "contacted",
      notes: "Llamé, vuelve el lunes",
    });
    expect(state).toEqual({ message: "Cambios guardados." });
    expect(revalidatePath).toHaveBeenCalledWith("/admin", "layout");
  });

  it("supports the one-tap status change (no notes field)", async () => {
    await updateLeadAction("l1", {}, form({ status: "contacted" }));

    expect(updateLead).toHaveBeenCalledWith("jwt", "l1", { status: "contacted" });
  });

  it("rejects an invalid status or overlong notes without calling the API", async () => {
    expect((await updateLeadAction("l1", {}, form({ status: "spam" }))).error).toBeDefined();
    expect(
      (await updateLeadAction("l1", {}, form({ status: "new", notes: "x".repeat(2001) }))).error,
    ).toMatch(/2000/);
    expect(updateLead).not.toHaveBeenCalled();
  });

  it("says when nothing changed", async () => {
    updateLead.mockRejectedValue(new ApiError(400, "Nothing to update"));

    expect(await updateLeadAction("l1", {}, form({ status: "new" }))).toEqual({
      message: "No había cambios para guardar.",
    });
  });

  it("handles a gone lead and an expired session", async () => {
    updateLead.mockRejectedValueOnce(new ApiError(404, "Lead not found"));
    await expect(updateLeadAction("l1", {}, form({ status: "closed" }))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );

    updateLead.mockRejectedValueOnce(new ApiError(401, "Unauthorized"));
    await expectRedirect(
      updateLeadAction("l1", {}, form({ status: "closed" })),
      "/admin/login?reason=expired",
    );
  });
});

describe("deleteLeadAction", () => {
  it("deletes and returns to the inbox with a notice", async () => {
    await expectRedirect(deleteLeadAction("l1"), "/admin/consultas?eliminada=1");

    expect(deleteLead).toHaveBeenCalledWith("jwt", "l1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin", "layout");
  });

  it("explains that only admins can delete", async () => {
    deleteLead.mockRejectedValue(new ApiError(403, "Forbidden"));

    expect((await deleteLeadAction("l1")).error).toMatch(/administrador/);
  });
});

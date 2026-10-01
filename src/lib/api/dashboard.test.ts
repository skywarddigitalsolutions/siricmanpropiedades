// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("./client", () => ({ apiFetch }));

import { getDashboard } from "./dashboard";

beforeEach(() => apiFetch.mockReset());

describe("dashboard API", () => {
  it("reads GET /admin/dashboard with the session token", async () => {
    const summary = { leads: { new: 1, total: 2 } };
    apiFetch.mockResolvedValue(summary);

    expect(await getDashboard("jwt")).toBe(summary);
    expect(apiFetch).toHaveBeenCalledWith("/admin/dashboard", { token: "jwt" });
  });
});

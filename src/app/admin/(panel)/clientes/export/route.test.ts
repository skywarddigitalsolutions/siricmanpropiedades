// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RedirectError, expectRedirect } from "@/test/next-server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const { exportClientsCsv } = vi.hoisted(() => ({ exportClientsCsv: vi.fn() }));
vi.mock("@/lib/api/clients", () => ({ exportClientsCsv }));

const { getSessionToken } = vi.hoisted(() => ({ getSessionToken: vi.fn() }));
vi.mock("@/lib/session/dal", () => ({ getSessionToken }));

import { ApiError } from "@/lib/api/client";
import { GET } from "./route";

const request = (search = "") =>
  new Request(`https://admin.example.com/admin/clientes/export${search}`);

beforeEach(() => {
  vi.clearAllMocks();
  getSessionToken.mockResolvedValue("jwt");
  exportClientsCsv.mockResolvedValue(
    new Response("email,name\r\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="clientes.csv"',
      },
    }),
  );
});

describe("GET /admin/clientes/export", () => {
  it("streams the CSV with the back content headers, keeping the search", async () => {
    const response = await GET(request("?q=ana"));

    expect(exportClientsCsv).toHaveBeenCalledWith("jwt", { q: "ana" });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="clientes.csv"');
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toBe("email,name\r\n");
  });

  it("exports everything without a search", async () => {
    await GET(request());

    expect(exportClientsCsv).toHaveBeenCalledWith("jwt", {});
  });

  it("redirects to the login without a session", async () => {
    getSessionToken.mockImplementation(() => {
      throw new RedirectError("/admin/login");
    });

    await expectRedirect(GET(request()), "/admin/login");
    expect(exportClientsCsv).not.toHaveBeenCalled();
  });

  it("redirects to the login when the session expired", async () => {
    exportClientsCsv.mockRejectedValue(new ApiError(401, "Unauthorized"));

    await expectRedirect(GET(request()), "/admin/login?reason=expired");
  });

  it("answers 403 for a role without access and 502 when the API fails", async () => {
    exportClientsCsv.mockRejectedValueOnce(new ApiError(403, "Forbidden"));
    expect((await GET(request())).status).toBe(403);

    exportClientsCsv.mockRejectedValueOnce(new ApiError(0, "down"));
    expect((await GET(request())).status).toBe(502);
  });
});

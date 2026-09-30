// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockRequestHeaders } from "@/test/next-server";

const { headers } = vi.hoisted(() => ({ headers: vi.fn() }));
vi.mock("next/headers", () => ({ headers }));

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubEnv("API_INTERNAL_URL", "http://api:3000");
    headers.mockResolvedValue(mockRequestHeaders());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function loadClient() {
    return await import("./client");
  }

  function stubFetch(response: Response) {
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("composes the URL with the /api prefix and no trailing slash", async () => {
    const { apiFetch } = await loadClient();
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await apiFetch("/auth/login", { method: "POST", body: {} });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api:3000/api/auth/login",
      expect.anything(),
    );
  });

  it("strips a trailing slash from API_INTERNAL_URL before composing the URL", async () => {
    vi.stubEnv("API_INTERNAL_URL", "http://api:3000/");
    const { apiFetch } = await loadClient();
    const fetchMock = stubFetch(new Response("{}", { status: 200 }));

    await apiFetch("/auth/me");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api:3000/api/auth/me",
      expect.anything(),
    );
  });

  it("throws when API_INTERNAL_URL is not configured", async () => {
    vi.stubEnv("API_INTERNAL_URL", "");
    const { apiFetch } = await loadClient();

    await expect(apiFetch("/auth/me")).rejects.toThrow(
      "API_INTERNAL_URL is not configured",
    );
  });

  it("includes the Authorization header only when a token is provided", async () => {
    const { apiFetch } = await loadClient();
    const fetchMock = stubFetch(new Response("{}", { status: 200 }));

    await apiFetch("/auth/me", { token: "the-bearer-token" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestHeaders = init.headers as Record<string, string>;
    expect(requestHeaders.Authorization).toBe("Bearer the-bearer-token");
  });

  it("omits the Authorization header when no token is provided", async () => {
    const { apiFetch } = await loadClient();
    const fetchMock = stubFetch(new Response("{}", { status: 200 }));

    await apiFetch("/auth/login", { method: "POST", body: {} });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestHeaders = init.headers as Record<string, string>;
    expect(requestHeaders.Authorization).toBeUndefined();
  });

  it("forwards X-Forwarded-For when the inbound request carries a valid IP", async () => {
    headers.mockResolvedValue(
      mockRequestHeaders({ "x-forwarded-for": "203.0.113.7" }),
    );
    const { apiFetch } = await loadClient();
    const fetchMock = stubFetch(new Response("{}", { status: 200 }));

    await apiFetch("/auth/me");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestHeaders = init.headers as Record<string, string>;
    expect(requestHeaders["X-Forwarded-For"]).toBe("203.0.113.7");
  });

  it("omits X-Forwarded-For when the inbound request has no valid IP", async () => {
    headers.mockResolvedValue(mockRequestHeaders());
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { apiFetch } = await loadClient();
    const fetchMock = stubFetch(new Response("{}", { status: 200 }));

    await apiFetch("/auth/me");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const requestHeaders = init.headers as Record<string, string>;
    expect(requestHeaders["X-Forwarded-For"]).toBeUndefined();
    warnSpy.mockRestore();
  });

  it("always requests with cache: no-store", async () => {
    const { apiFetch } = await loadClient();
    const fetchMock = stubFetch(new Response("{}", { status: 200 }));

    await apiFetch("/auth/me");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.cache).toBe("no-store");
  });

  it("parses a 2xx JSON body and returns it", async () => {
    const { apiFetch } = await loadClient();
    stubFetch(
      new Response(JSON.stringify({ id: "u1", userName: "gabriel" }), {
        status: 200,
      }),
    );

    const result = await apiFetch<{ id: string; userName: string }>(
      "/auth/me",
    );

    expect(result).toEqual({ id: "u1", userName: "gabriel" });
  });

  it("returns undefined for an empty 201 body", async () => {
    const { apiFetch } = await loadClient();
    stubFetch(new Response("", { status: 201 }));

    const result = await apiFetch("/auth/logout", { method: "POST" });

    expect(result).toBeUndefined();
  });

  it.each([
    [401, "Usuario o contraseña incorrectos"],
    [400, "Solicitud inválida"],
    [429, "Demasiados intentos"],
    [500, "Error interno"],
  ])("maps a %i response to ApiError(%i, message)", async (status, message) => {
    const { apiFetch, ApiError } = await loadClient();
    stubFetch(
      new Response(JSON.stringify({ message }), {
        status,
        statusText: "Error",
      }),
    );

    await expect(apiFetch("/auth/login", { method: "POST" })).rejects.toMatchObject(
      { status, message },
    );
    await expect(apiFetch("/auth/login", { method: "POST" })).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("maps a network failure to ApiError(0)", async () => {
    const { apiFetch, ApiError } = await loadClient();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    await expect(apiFetch("/auth/me")).rejects.toBeInstanceOf(ApiError);
    await expect(apiFetch("/auth/me")).rejects.toMatchObject({ status: 0 });
  });

  it("maps an aborted/timed-out request to ApiError(0)", async () => {
    const { apiFetch, ApiError } = await loadClient();
    const abortError = new DOMException("The operation was aborted", "TimeoutError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(apiFetch("/auth/me")).rejects.toBeInstanceOf(ApiError);
    await expect(apiFetch("/auth/me")).rejects.toMatchObject({ status: 0 });
  });
});

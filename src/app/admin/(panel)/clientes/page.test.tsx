import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { RedirectError, expectRedirect } from "@/test/next-server";
import type { Client } from "@/lib/api/clients";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const { listClients } = vi.hoisted(() => ({ listClients: vi.fn() }));
vi.mock("@/lib/api/clients", () => ({ listClients }));

const { getSessionToken } = vi.hoisted(() => ({ getSessionToken: vi.fn() }));
vi.mock("@/lib/session/dal", () => ({ getSessionToken }));

import { ApiError } from "@/lib/api/client";
import ClientsPage from "./page";

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    email: "ana@mail.com",
    name: "Ana García",
    phone: "11 3896-7363",
    inquiries: 3,
    firstInquiryAt: "2026-08-01T15:00:00.000Z",
    lastInquiryAt: "2026-09-30T15:05:00.000Z",
    properties: [
      { id: "p1", code: "SP-0007", title: "Casa en Palermo" },
      { id: "p2", code: "SP-0010", title: "Depto en Belgrano" },
    ],
    ...overrides,
  };
}

const query = (params: Record<string, string> = {}) => ({ searchParams: Promise.resolve(params) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-01T12:00:00.000Z"));
  getSessionToken.mockResolvedValue("jwt");
  listClients.mockResolvedValue({ items: [makeClient()], total: 1 });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ClientsPage", () => {
  it("lists clients with contact actions, counts, last inquiry and properties", async () => {
    render(await ClientsPage(query()));

    expect(listClients).toHaveBeenCalledWith("jwt", { q: "", limit: 20, offset: 0 });
    expect(screen.getByRole("heading", { level: 1, name: "Clientes" })).toBeInTheDocument();
    const row = screen.getByRole("row", { name: /Ana García/ });
    expect(within(row).getByRole("link", { name: "ana@mail.com" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:ana@mail\.com/),
    );
    expect(within(row).getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5491138967363"),
    );
    expect(within(row).getByRole("link", { name: /Llamar/ })).toHaveAttribute(
      "href",
      "tel:1138967363",
    );
    expect(within(row).getByText("3 consultas")).toBeInTheDocument();
    expect(within(row).getByText("hace 20 horas")).toBeInTheDocument();
    expect(within(row).getByText("30/09/2026")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "SP-0007" })).toHaveAttribute(
      "href",
      "/admin/propiedades/p1",
    );
    expect(within(row).getByRole("link", { name: /Ver consultas/ })).toHaveAttribute(
      "href",
      "/admin/consultas?estado=todas&q=ana%40mail.com",
    );
  });

  it("uses the singular for one inquiry and omits missing phone actions", async () => {
    listClients.mockResolvedValue({
      items: [makeClient({ inquiries: 1, phone: null, properties: [] })],
      total: 1,
    });

    render(await ClientsPage(query()));

    expect(screen.getByText("1 consulta")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Llamar/ })).toBeNull();
  });

  it("searches through a GET form and keeps the query in the export link", async () => {
    render(await ClientsPage(query({ q: "ana", pagina: "2" })));

    expect(listClients).toHaveBeenCalledWith("jwt", { q: "ana", limit: 20, offset: 20 });
    const search = screen.getByRole("search");
    expect(search).toHaveAttribute("method", "get");
    expect(search).toHaveAttribute("action", "/admin/clientes");
    expect(within(search).getByLabelText("Buscar clientes")).toHaveValue("ana");
    expect(screen.getByRole("link", { name: /Exportar CSV/ })).toHaveAttribute(
      "href",
      "/admin/clientes/export?q=ana",
    );
  });

  it("paginates and shows the total", async () => {
    listClients.mockResolvedValue({ items: [makeClient()], total: 45 });

    render(await ClientsPage(query({ pagina: "2", q: "ana" })));

    expect(screen.getByText("45 clientes")).toBeInTheDocument();
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/admin/clientes?q=ana&pagina=3",
    );
  });

  it("tells when there are no clients, with and without a search", async () => {
    listClients.mockResolvedValue({ items: [], total: 0 });

    render(await ClientsPage(query()));
    expect(screen.getByText(/Todavía no hay clientes/)).toBeInTheDocument();
    cleanup();

    render(await ClientsPage(query({ q: "zzz" })));
    expect(screen.getByText(/No encontramos clientes para “zzz”/)).toBeInTheDocument();
  });

  it("shows an error when the API is down", async () => {
    listClients.mockRejectedValue(new ApiError(0, "down"));

    render(await ClientsPage(query()));

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar los clientes");
  });

  it("redirects to the login when the session expired", async () => {
    listClients.mockRejectedValue(new ApiError(401, "Unauthorized"));

    await expectRedirect(ClientsPage(query()), "/admin/login?reason=expired");
  });
});

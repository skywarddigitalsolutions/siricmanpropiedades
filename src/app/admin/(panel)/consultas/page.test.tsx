import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { RedirectError, expectRedirect } from "@/test/next-server";
import type { Lead } from "@/lib/api/leads";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const { listLeads } = vi.hoisted(() => ({ listLeads: vi.fn() }));
vi.mock("@/lib/api/leads", () => ({ listLeads }));

const { getSessionToken } = vi.hoisted(() => ({ getSessionToken: vi.fn() }));
vi.mock("@/lib/session/dal", () => ({ getSessionToken }));

import { ApiError } from "@/lib/api/client";
import LeadsInboxPage from "./page";

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "l1",
    type: "property_inquiry",
    status: "new",
    name: "Ana García",
    phone: "11 3896-7363",
    email: null,
    message: "Hola, ¿se puede visitar el sábado?",
    topic: null,
    details: null,
    notes: null,
    property: { id: "p1", code: "SP-0007", title: "Casa en Palermo", slug: "casa-en-palermo" },
    createdAt: "2026-09-30T15:05:00.000Z",
    updatedAt: "2026-09-30T15:05:00.000Z",
    ...overrides,
  };
}

const query = (params: Record<string, string> = {}) => ({ searchParams: Promise.resolve(params) });

afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  getSessionToken.mockResolvedValue("jwt");
  listLeads.mockResolvedValue({ items: [makeLead()], total: 1 });
});

describe("LeadsInboxPage", () => {
  it("lists new leads by default, newest first, linking to each one", async () => {
    render(await LeadsInboxPage(query()));

    expect(listLeads).toHaveBeenCalledWith("jwt", { status: "new", limit: 20, offset: 0 });
    expect(screen.getByRole("heading", { level: 1, name: "Consultas" })).toBeInTheDocument();
    const item = screen.getByRole("link", { name: /Ana García/ });
    expect(item).toHaveAttribute("href", "/admin/consultas/l1");
    expect(within(item).getByText("SP-0007 · Casa en Palermo")).toBeInTheDocument();
    expect(within(item).getByText("30/09 12:05")).toBeInTheDocument();
    expect(within(item).getByText(/se puede visitar/)).toBeInTheDocument();
  });

  it("filters by status with tabs and by type with chips", async () => {
    render(await LeadsInboxPage(query({ estado: "contactadas", tipo: "tasacion" })));

    expect(listLeads).toHaveBeenCalledWith("jwt", {
      status: "contacted",
      type: "appraisal",
      limit: 20,
      offset: 0,
    });
    const tabs = screen.getByRole("navigation", { name: "Estado" });
    expect(within(tabs).getByRole("link", { name: "Contactadas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(tabs).getByRole("link", { name: "Todas" })).toHaveAttribute(
      "href",
      "/admin/consultas?estado=todas&tipo=tasacion",
    );
    const types = screen.getByRole("navigation", { name: "Tipo" });
    expect(within(types).getByRole("link", { name: "Todos los tipos" })).toHaveAttribute(
      "href",
      "/admin/consultas?estado=contactadas",
    );
  });

  it("paginates", async () => {
    listLeads.mockResolvedValue({ items: [makeLead()], total: 45 });

    render(await LeadsInboxPage(query({ pagina: "2" })));

    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/admin/consultas?pagina=3",
    );
  });

  it("tells when there are no new leads", async () => {
    listLeads.mockResolvedValue({ items: [], total: 0 });

    render(await LeadsInboxPage(query()));

    expect(screen.getByText("No hay consultas nuevas.")).toBeInTheDocument();
  });

  it("confirms a deletion when coming back from a lead", async () => {
    render(await LeadsInboxPage(query({ eliminada: "1" })));

    expect(screen.getByRole("status")).toHaveTextContent("Consulta eliminada.");
  });

  it("redirects to the login when the session expired", async () => {
    listLeads.mockRejectedValue(new ApiError(401, "Unauthorized"));

    await expectRedirect(LeadsInboxPage(query()), "/admin/login?reason=expired");
  });
});

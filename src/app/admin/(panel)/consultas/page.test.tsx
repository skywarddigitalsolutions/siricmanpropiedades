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

vi.mock("./[id]/actions", () => ({ updateLeadAction: vi.fn() }));

import { ApiError } from "@/lib/api/client";
import LeadsInboxPage from "./page";

const PROPERTY_ID = "3f2b8c1e-5a1d-4c0e-9b7a-1d2e3f4a5b6c";

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "l1",
    type: "property_inquiry",
    status: "new",
    name: "Ana García",
    phone: "11 3896-7363",
    email: "ana@mail.com",
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

const COUNTS = { new: 2, contacted: 5, closed: 1 };

const query = (params: Record<string, string> = {}) => ({ searchParams: Promise.resolve(params) });

afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  getSessionToken.mockResolvedValue("jwt");
  listLeads.mockResolvedValue({ items: [makeLead()], total: 1, counts: COUNTS });
});

describe("LeadsInboxPage", () => {
  it("lists new leads by default with property chip, contact line, preview and status", async () => {
    render(await LeadsInboxPage(query()));

    expect(listLeads).toHaveBeenCalledWith("jwt", { status: "new", limit: 20, offset: 0 });
    expect(screen.getByRole("heading", { level: 1, name: "Consultas" })).toBeInTheDocument();
    const item = screen.getByRole("listitem", { name: "Ana García" });
    expect(within(item).getByRole("link", { name: /Ana García/ })).toHaveAttribute(
      "href",
      "/admin/consultas/l1",
    );
    expect(within(item).getByText("SP-0007")).toBeInTheDocument();
    expect(within(item).getByText("30/09 12:05")).toBeInTheDocument();
    expect(within(item).getByText(/11 3896-7363/)).toBeInTheDocument();
    expect(within(item).getByText(/ana@mail\.com/)).toBeInTheDocument();
    expect(within(item).getByText(/se puede visitar/)).toBeInTheDocument();
    expect(within(item).getByText("Nueva")).toBeInTheDocument();
  });

  it("shows the topic or type instead of a chip when the lead has no property", async () => {
    listLeads.mockResolvedValue({
      items: [makeLead({ type: "appraisal", property: null })],
      total: 1,
      counts: COUNTS,
    });

    render(await LeadsInboxPage(query()));

    expect(screen.getByText("Pedido de tasación")).toBeInTheDocument();
  });

  it.each([
    [{ type: "appraisal", topic: "sell" }, "Pedido de tasación · Quiere vender o tasar"],
    [{ type: "appraisal", topic: "rent" }, "Pedido de tasación · Quiere alquilar"],
    [{ type: "contact", topic: "rental_management" }, "Contacto · Administración de alquileres"],
  ] as const)("summarizes %j as %s", async (overrides, summary) => {
    listLeads.mockResolvedValue({
      items: [makeLead({ ...overrides, property: null })],
      total: 1,
      counts: COUNTS,
    });

    render(await LeadsInboxPage(query()));

    expect(screen.getByText(summary)).toBeInTheDocument();
  });

  it("offers one chip per category in the category filter", async () => {
    render(await LeadsInboxPage(query()));

    const chips = screen.getByRole("navigation", { name: "Categoría" });
    expect(within(chips).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Todas",
      "Tasaciones",
      "Compra y alquiler",
      "Administración",
      "Otras",
    ]);
    expect(within(chips).getByRole("link", { name: "Todas" })).toHaveAttribute("aria-current", "page");
    expect(within(chips).getByRole("link", { name: "Tasaciones" })).toHaveAttribute(
      "href",
      "/admin/consultas?categoria=tasacion",
    );
    expect(within(chips).getByRole("link", { name: "Compra y alquiler" })).toHaveAttribute(
      "href",
      "/admin/consultas?categoria=busqueda",
    );
    expect(within(chips).getByRole("link", { name: "Administración" })).toHaveAttribute(
      "href",
      "/admin/consultas?categoria=administracion",
    );
    expect(within(chips).getByRole("link", { name: "Otras" })).toHaveAttribute(
      "href",
      "/admin/consultas?categoria=otras",
    );
  });

  it("tags each card with its category and marks it for the colored edge", async () => {
    listLeads.mockResolvedValue({
      items: [
        makeLead({ id: "a", name: "Ana", type: "appraisal", property: null }),
        makeLead({ id: "b", name: "Beto" }),
        makeLead({ id: "c", name: "Cora", type: "contact", topic: "consortium", property: null }),
        makeLead({ id: "d", name: "Dani", type: "contact", topic: "sell", property: null }),
      ],
      total: 4,
      counts: COUNTS,
    });

    render(await LeadsInboxPage(query()));

    for (const [name, label, category] of [
      ["Ana", "Tasaciones", "appraisal"],
      ["Beto", "Compra y alquiler", "search"],
      ["Cora", "Administración", "management"],
      ["Dani", "Otras", "other"],
    ]) {
      const item = screen.getByRole("listitem", { name });
      expect(item).toHaveAttribute("data-category", category);
      expect(within(item).getByText(label)).toHaveAttribute("data-category", category);
    }
  });

  it("maps an old tipo link onto its category", async () => {
    render(await LeadsInboxPage(query({ tipo: "tasacion" })));

    expect(listLeads).toHaveBeenCalledWith("jwt", {
      status: "new",
      category: "appraisal",
      limit: 20,
      offset: 0,
    });
  });

  it("offers WhatsApp and one-tap contacted on new leads with a phone", async () => {
    render(await LeadsInboxPage(query()));

    const item = screen.getByRole("listitem", { name: "Ana García" });
    expect(within(item).getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5491138967363"),
    );
    expect(within(item).getByRole("button", { name: /Marcar como contactada/ })).toBeInTheDocument();
  });

  it("hides the contacted button once contacted and WhatsApp without a phone", async () => {
    listLeads.mockResolvedValue({
      items: [makeLead({ status: "contacted", phone: null })],
      total: 1,
      counts: COUNTS,
    });

    render(await LeadsInboxPage(query({ estado: "todas" })));

    expect(screen.queryByRole("button", { name: /Marcar como contactada/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).toBeNull();
  });

  it("filters by status with tabs showing counts, and by category with chips", async () => {
    render(await LeadsInboxPage(query({ estado: "contactadas", categoria: "tasacion" })));

    expect(listLeads).toHaveBeenCalledWith("jwt", {
      status: "contacted",
      category: "appraisal",
      limit: 20,
      offset: 0,
    });
    const tabs = screen.getByRole("navigation", { name: "Estado" });
    const contacted = within(tabs).getByRole("link", { name: /^Contactadas/ });
    expect(contacted).toHaveAttribute("aria-current", "page");
    expect(contacted).toHaveTextContent("5");
    expect(within(tabs).getByRole("link", { name: /^Nuevas/ })).toHaveTextContent("2");
    expect(within(tabs).getByRole("link", { name: /^Cerradas/ })).toHaveTextContent("1");
    const all = within(tabs).getByRole("link", { name: /^Todas/ });
    expect(all).toHaveTextContent("8");
    expect(all).toHaveAttribute("href", "/admin/consultas?estado=todas&categoria=tasacion");
    const types = screen.getByRole("navigation", { name: "Categoría" });
    expect(within(types).getByRole("link", { name: "Todas" })).toHaveAttribute(
      "href",
      "/admin/consultas?estado=contactadas",
    );
  });

  it("searches with q, keeping status and category, and sends it to the API", async () => {
    render(await LeadsInboxPage(query({ estado: "todas", categoria: "otras", q: "ana@mail.com" })));

    expect(listLeads).toHaveBeenCalledWith("jwt", {
      category: "other",
      q: "ana@mail.com",
      limit: 20,
      offset: 0,
    });
    const search = screen.getByRole("search");
    expect(search).toHaveAttribute("action", "/admin/consultas");
    expect(within(search).getByLabelText("Buscar consultas")).toHaveValue("ana@mail.com");
    expect(search.querySelector('input[name="estado"]')).toHaveAttribute("value", "todas");
    expect(search.querySelector('input[name="categoria"]')).toHaveAttribute("value", "otras");
    expect(within(search).getByRole("link", { name: "Limpiar" })).toHaveAttribute(
      "href",
      "/admin/consultas?estado=todas&categoria=otras",
    );
  });

  it("filters by property", async () => {
    render(await LeadsInboxPage(query({ propiedad: PROPERTY_ID })));

    expect(listLeads).toHaveBeenCalledWith("jwt", {
      status: "new",
      propertyId: PROPERTY_ID,
      limit: 20,
      offset: 0,
    });
  });

  it("ignores a malformed property id instead of failing the page", async () => {
    render(await LeadsInboxPage(query({ propiedad: "not-a-uuid" })));

    expect(listLeads).toHaveBeenCalledWith("jwt", { status: "new", limit: 20, offset: 0 });
  });

  it("paginates keeping the search", async () => {
    listLeads.mockResolvedValue({ items: [makeLead()], total: 45, counts: COUNTS });

    render(await LeadsInboxPage(query({ pagina: "2", q: "ana" })));

    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/admin/consultas?q=ana&pagina=3",
    );
  });

  it("tells when there are no new leads, or no match for a search", async () => {
    listLeads.mockResolvedValue({ items: [], total: 0, counts: COUNTS });

    render(await LeadsInboxPage(query()));
    expect(screen.getByText("No hay consultas nuevas.")).toBeInTheDocument();
    cleanup();

    render(await LeadsInboxPage(query({ q: "zzz" })));
    expect(screen.getByText(/No encontramos consultas para “zzz”/)).toBeInTheDocument();
  });

  it("shows no count pills when the API does not send counts", async () => {
    listLeads.mockResolvedValue({ items: [makeLead()], total: 1 });

    render(await LeadsInboxPage(query()));

    const tabs = screen.getByRole("navigation", { name: "Estado" });
    expect(within(tabs).getByRole("link", { name: "Nuevas" })).toBeInTheDocument();
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

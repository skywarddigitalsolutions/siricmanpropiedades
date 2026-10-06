import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { RedirectError, expectRedirect } from "@/test/next-server";
import type { Lead } from "@/lib/api/leads";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const { getLead, listLeads } = vi.hoisted(() => ({ getLead: vi.fn(), listLeads: vi.fn() }));
vi.mock("@/lib/api/leads", () => ({ getLead, listLeads }));

const { getSessionToken, getCurrentUser } = vi.hoisted(() => ({
  getSessionToken: vi.fn(),
  getCurrentUser: vi.fn(),
}));
vi.mock("@/lib/session/dal", () => ({ getSessionToken, getCurrentUser }));

vi.mock("./actions", () => ({ updateLeadAction: vi.fn(), deleteLeadAction: vi.fn() }));

import { ApiError } from "@/lib/api/client";
import LeadDetailPage from "./page";

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "l1",
    type: "property_inquiry",
    status: "new",
    name: "Ana García",
    phone: "11 3896-7363",
    email: "ana@mail.com",
    message: "Hola,\n¿se puede visitar el sábado?",
    topic: null,
    details: null,
    notes: null,
    property: { id: "p1", code: "SP-0007", title: "Casa en Palermo", slug: "casa-en-palermo" },
    createdAt: "2026-09-30T15:05:00.000Z",
    updatedAt: "2026-09-30T15:05:00.000Z",
    ...overrides,
  };
}

const params = () => ({ params: Promise.resolve({ id: "l1" }) });

afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  getSessionToken.mockResolvedValue("jwt");
  getCurrentUser.mockResolvedValue({ id: "u1", userName: "maria", isActive: true, roles: ["manager"] });
  getLead.mockResolvedValue(makeLead());
  listLeads.mockResolvedValue({ items: [], total: 1 });
});

describe("LeadDetailPage", () => {
  it("shows who wrote, when, about what, and the message", async () => {
    render(await LeadDetailPage(params()));

    expect(getLead).toHaveBeenCalledWith("jwt", "l1");
    expect(screen.getByRole("heading", { level: 1, name: "Ana García" })).toBeInTheDocument();
    expect(screen.getByText(/30\/09 12:05/)).toBeInTheDocument();
    expect(screen.getByText("Consulta por propiedad")).toBeInTheDocument();
    expect(screen.getByText(/se puede visitar el sábado/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver a consultas/ })).toHaveAttribute(
      "href",
      "/admin/consultas",
    );
  });

  it("offers one-tap call, WhatsApp and email", async () => {
    render(await LeadDetailPage(params()));

    const contact = screen.getByRole("region", { name: "Responder" });
    expect(within(contact).getByRole("link", { name: /Llamar/ })).toHaveAttribute(
      "href",
      "tel:1138967363",
    );
    expect(within(contact).getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5491138967363"),
    );
    expect(within(contact).getByRole("link", { name: /Email/ })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:ana@mail.com"),
    );
  });

  it("answers by WhatsApp with one primary button", async () => {
    render(await LeadDetailPage(params()));

    expect(screen.getByRole("link", { name: "Responder por WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5491138967363"),
    );
  });

  it("links to the other inquiries of the same person (by email) when there are more", async () => {
    listLeads.mockResolvedValue({ items: [], total: 3 });

    render(await LeadDetailPage(params()));

    expect(listLeads).toHaveBeenCalledWith("jwt", { q: "ana@mail.com", limit: 1 });
    expect(screen.getByRole("link", { name: "Ver 3 consultas de esta persona" })).toHaveAttribute(
      "href",
      "/admin/consultas?estado=todas&q=ana%40mail.com",
    );
  });

  it("falls back to the phone when the lead has no email", async () => {
    getLead.mockResolvedValue(makeLead({ email: null }));
    listLeads.mockResolvedValue({ items: [], total: 2 });

    render(await LeadDetailPage(params()));

    expect(listLeads).toHaveBeenCalledWith("jwt", { q: "11 3896-7363", limit: 1 });
    expect(screen.getByRole("link", { name: "Ver 2 consultas de esta persona" })).toHaveAttribute(
      "href",
      "/admin/consultas?estado=todas&q=11+3896-7363",
    );
  });

  it("shows no link when it is the only inquiry, the lookup fails or there is no contact", async () => {
    render(await LeadDetailPage(params()));
    expect(screen.queryByRole("link", { name: /de esta persona/ })).toBeNull();
    cleanup();

    listLeads.mockRejectedValue(new ApiError(0, "down"));
    render(await LeadDetailPage(params()));
    expect(screen.queryByRole("link", { name: /de esta persona/ })).toBeNull();
    cleanup();

    listLeads.mockClear();
    getLead.mockResolvedValue(makeLead({ email: null, phone: null }));
    render(await LeadDetailPage(params()));
    expect(listLeads).not.toHaveBeenCalled();
  });

  it("links the property to the editor and the public page", async () => {
    render(await LeadDetailPage(params()));

    const property = screen.getByRole("region", { name: "Propiedad" });
    expect(within(property).getByRole("link", { name: /Editar/ })).toHaveAttribute(
      "href",
      "/admin/propiedades/p1",
    );
    expect(within(property).getByRole("link", { name: /Ver en el sitio/ })).toHaveAttribute(
      "href",
      "/propiedades/casa-en-palermo",
    );
  });

  it("links the public page on the site host when the admin has its own host", async () => {
    vi.stubEnv("ADMIN_URL", "https://admin.example.com");
    vi.stubEnv("SITE_URL", "https://example.com");
    render(await LeadDetailPage(params()));

    expect(screen.getByRole("link", { name: /Ver en el sitio/ })).toHaveAttribute(
      "href",
      "https://example.com/propiedades/casa-en-palermo",
    );
    vi.unstubAllEnvs();
  });

  it("shows appraisal details and contact topics", async () => {
    getLead.mockResolvedValue(
      makeLead({
        type: "appraisal",
        property: null,
        details: {
          propertyType: "apartment",
          address: "Gorriti 4800",
          neighborhood: "Palermo",
          rooms: 3,
          area: 70,
        },
      }),
    );

    render(await LeadDetailPage(params()));

    expect(screen.getByText("Departamento")).toBeInTheDocument();
    expect(screen.getByText("Gorriti 4800")).toBeInTheDocument();
    const terms = screen.getAllByRole("term").map((term) => term.textContent);
    expect(terms.slice(terms.indexOf("Dirección"), terms.indexOf("Dirección") + 2)).toEqual([
      "Dirección",
      "Barrio",
    ]);
    expect(screen.getByText("Palermo")).toBeInTheDocument();
    expect(screen.getByText("70 m²")).toBeInTheDocument();
  });

  it("offers delete only to admins", async () => {
    render(await LeadDetailPage(params()));
    expect(screen.queryByText("Eliminar consulta")).toBeNull();
    cleanup();

    getCurrentUser.mockResolvedValue({ id: "u1", userName: "gabriel", isActive: true, roles: ["admin"] });
    render(await LeadDetailPage(params()));
    expect(screen.getByText("Eliminar consulta")).toBeInTheDocument();
  });

  it.each([404, 400])("renders not found when the API answers %i", async (status) => {
    getLead.mockRejectedValue(new ApiError(status, "nope"));

    await expect(LeadDetailPage(params())).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("redirects to the login when the session expired", async () => {
    getLead.mockRejectedValue(new ApiError(401, "Unauthorized"));

    await expectRedirect(LeadDetailPage(params()), "/admin/login?reason=expired");
  });
});

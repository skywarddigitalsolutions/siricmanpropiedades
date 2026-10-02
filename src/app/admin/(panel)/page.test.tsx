import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { RedirectError, expectRedirect } from "@/test/next-server";
import type { DashboardSummary } from "@/lib/api/dashboard";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const { getDashboard } = vi.hoisted(() => ({ getDashboard: vi.fn() }));
vi.mock("@/lib/api/dashboard", () => ({ getDashboard }));

const { getSessionToken, getCurrentUser } = vi.hoisted(() => ({
  getSessionToken: vi.fn(),
  getCurrentUser: vi.fn(),
}));
vi.mock("@/lib/session/dal", () => ({ getSessionToken, getCurrentUser }));

import { ApiError } from "@/lib/api/client";
import AdminPanelPage from "./page";

function makeSummary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    leads: { new: 3, total: 12 },
    properties: { draft: 4, published: 9, archived: 1, publishedWithoutImages: 2 },
    latestLeads: [
      {
        id: "l1",
        name: "Ana García",
        type: "property_inquiry",
        status: "new",
        createdAt: "2026-09-30T15:05:00.000Z",
        property: { id: "p1", code: "SP-0007", title: "Casa en Palermo" },
      },
      {
        id: "l2",
        name: "Luis Pérez",
        type: "appraisal",
        status: "contacted",
        createdAt: "2026-09-29T10:00:00.000Z",
        property: null,
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionToken.mockResolvedValue("jwt");
  getCurrentUser.mockResolvedValue({
    id: "u1",
    userName: "gabriel",
    isActive: true,
    roles: ["admin"],
  });
  getDashboard.mockResolvedValue(makeSummary());
});

afterEach(() => cleanup());

describe("AdminPanelPage (home dashboard)", () => {
  it("does not redirect: it renders a greeting with the user's name", async () => {
    render(await AdminPanelPage());

    expect(screen.getByRole("heading", { level: 1, name: "Hola, gabriel" })).toBeInTheDocument();
    expect(getDashboard).toHaveBeenCalledWith("jwt");
  });

  it("shows the KPI cards as links to the filtered lists", async () => {
    render(await AdminPanelPage());

    const news = screen.getByRole("link", { name: /Consultas nuevas/ });
    expect(news).toHaveTextContent("3");
    expect(news).toHaveAttribute("href", "/admin/consultas");

    const drafts = screen.getByRole("link", { name: /Borradores/ });
    expect(drafts).toHaveTextContent("4");
    expect(drafts).toHaveAttribute("href", "/admin/propiedades?publicationStatus=draft");

    const noPhotos = screen.getByRole("link", { name: /Publicadas sin fotos/ });
    expect(noPhotos).toHaveTextContent("2");
    expect(noPhotos).toHaveAttribute(
      "href",
      "/admin/propiedades?publicationStatus=published&hasImages=false",
    );

    const published = screen.getByRole("link", { name: /^Publicadas\b(?! sin)/ });
    expect(published).toHaveTextContent("9");
    expect(published).toHaveAttribute("href", "/admin/propiedades?publicationStatus=published");
  });

  it("lists the latest leads with status badge, property chip and a link to the detail", async () => {
    render(await AdminPanelPage());

    const section = screen.getByRole("region", { name: "Últimas consultas" });
    const ana = within(section).getByRole("link", { name: /Ana García/ });
    expect(ana).toHaveAttribute("href", "/admin/consultas/l1");
    expect(within(section).getByText("SP-0007")).toBeInTheDocument();
    expect(within(section).getByText("Nueva")).toHaveAttribute("data-tone", "info");
    expect(within(section).getByText("Contactada")).toBeInTheDocument();
    expect(within(section).getByRole("link", { name: "Ver todas" })).toHaveAttribute(
      "href",
      "/admin/consultas?estado=todas",
    );
  });

  it("offers quick actions", async () => {
    render(await AdminPanelPage());

    expect(screen.getByRole("link", { name: "Nueva propiedad" })).toHaveAttribute(
      "href",
      "/admin/propiedades/nueva",
    );
    expect(screen.getByRole("link", { name: "Ver consultas" })).toHaveAttribute(
      "href",
      "/admin/consultas",
    );
    expect(screen.getByRole("link", { name: "Ver clientes" })).toHaveAttribute(
      "href",
      "/admin/clientes",
    );
  });

  it("shows an empty state when there are no leads yet", async () => {
    getDashboard.mockResolvedValue(makeSummary({ latestLeads: [], leads: { new: 0, total: 0 } }));

    render(await AdminPanelPage());

    expect(screen.getByText("Todavía no llegó ninguna consulta.")).toBeInTheDocument();
  });

  it("degrades gracefully when the API is down: greeting, notice and quick actions remain", async () => {
    getDashboard.mockRejectedValue(new ApiError(0, "No se pudo contactar al servicio."));

    render(await AdminPanelPage());

    expect(screen.getByRole("heading", { level: 1, name: "Hola, gabriel" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar el resumen");
    expect(screen.getByRole("link", { name: "Nueva propiedad" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Consultas nuevas/ })).not.toBeInTheDocument();
  });

  it("redirects to login on a 401", async () => {
    getDashboard.mockRejectedValue(new ApiError(401, "Unauthorized"));

    await expectRedirect(AdminPanelPage(), "/admin/login?reason=expired");
  });

  it("lets an unexpected error reach the error boundary", async () => {
    const error = new ApiError(403, "Forbidden");
    getDashboard.mockRejectedValue(error);

    await expect(AdminPanelPage()).rejects.toBe(error);
  });
});

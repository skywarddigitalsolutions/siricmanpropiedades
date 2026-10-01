import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RedirectError, expectRedirect } from "@/test/next-server";
import { makePropertyDetail } from "@/test/fixtures/property";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const { getProperty, listNeighborhoods } = vi.hoisted(() => ({
  getProperty: vi.fn(),
  listNeighborhoods: vi.fn(),
}));
vi.mock("@/lib/api/properties", () => ({ getProperty, listNeighborhoods }));

const { getSessionToken, getCurrentUser } = vi.hoisted(() => ({
  getSessionToken: vi.fn(),
  getCurrentUser: vi.fn(),
}));
vi.mock("@/lib/session/dal", () => ({ getSessionToken, getCurrentUser }));

vi.mock("./actions", () => ({ updatePropertyAction: vi.fn() }));
vi.mock("./image-actions", () => ({
  uploadImageAction: vi.fn(),
  reorderImagesAction: vi.fn(),
  deleteImageAction: vi.fn(),
}));
vi.mock("./lifecycle-actions", () => ({
  changePublicationAction: vi.fn(),
  changeDealStatusAction: vi.fn(),
  deletePropertyAction: vi.fn(),
}));

import { ApiError } from "@/lib/api/client";
import EditPropertyPage from "./page";

function renderPage(searchParams: Record<string, string> = {}) {
  return EditPropertyPage({
    params: Promise.resolve({ id: "p1" }),
    searchParams: Promise.resolve(searchParams),
  });
}

afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  getSessionToken.mockResolvedValue("jwt-1");
  getCurrentUser.mockResolvedValue({ id: "u1", userName: "gabriel", isActive: true, roles: ["manager"] });
  listNeighborhoods.mockResolvedValue([
    { id: "n1", name: "Palermo", slug: "palermo", createdAt: "2024-01-01" },
  ]);
});

describe("EditPropertyPage", () => {
  it("shows the property heading, code, statuses and the prefilled form", async () => {
    getProperty.mockResolvedValue(
      makePropertyDetail({ publicationStatus: "published", dealStatus: "reserved" }),
    );

    render(await renderPage());

    expect(getProperty).toHaveBeenCalledWith("jwt-1", "p1");
    expect(
      screen.getByRole("heading", { level: 1, name: "Casa en Palermo" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/SP-0001/)).toBeInTheDocument();
    expect(screen.getByText("Publicada")).toBeInTheDocument();
    expect(screen.getByText("Reservada", { ignore: "option" })).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Casa en Palermo");
    expect(screen.getByRole("link", { name: /Volver al listado/ })).toHaveAttribute(
      "href",
      "/admin/propiedades",
    );
  });

  it("confirms a fresh creation and a saved edit", async () => {
    getProperty.mockResolvedValue(makePropertyDetail());

    render(await renderPage({ creada: "1" }));
    expect(screen.getByText(/Propiedad creada/)).toHaveAttribute("role", "status");
    cleanup();

    render(await renderPage({ guardada: "1" }));
    expect(screen.getByText(/Cambios guardados/)).toHaveAttribute("role", "status");
  });

  it("shows the status and actions section", async () => {
    getProperty.mockResolvedValue(makePropertyDetail());

    render(await renderPage());

    expect(
      screen.getByRole("heading", { level: 2, name: "Estado y acciones" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeInTheDocument();
  });

  it("shows the photos section with the current photos", async () => {
    getProperty.mockResolvedValue(
      makePropertyDetail({
        images: [
          {
            id: "img-1",
            position: 0,
            url: "https://media.test/1.webp",
            width: 1600,
            height: 1200,
            thumbnailUrl: "https://media.test/1-thumb.webp",
            thumbnailWidth: 480,
            thumbnailHeight: 360,
            createdAt: "2024-01-01",
          },
        ],
      }),
    );

    render(await renderPage());

    expect(screen.getByRole("heading", { level: 2, name: "Fotos" })).toBeInTheDocument();
    expect(screen.getByAltText("Foto 1 (portada)")).toBeInTheDocument();
  });

  it("offers delete only to admins on never-published properties", async () => {
    getProperty.mockResolvedValue(makePropertyDetail({ firstPublishedAt: null }));
    render(await renderPage());
    expect(screen.queryByText("Eliminar propiedad")).toBeNull();
    cleanup();

    getCurrentUser.mockResolvedValue({ id: "u1", userName: "gabriel", isActive: true, roles: ["admin"] });
    render(await renderPage());
    expect(screen.getByText("Eliminar propiedad")).toBeInTheDocument();
    cleanup();

    getProperty.mockResolvedValue(makePropertyDetail({ firstPublishedAt: "2024-02-01" }));
    render(await renderPage());
    expect(screen.queryByText("Eliminar propiedad")).toBeNull();
    expect(screen.getByText(/ya fue publicada/)).toBeInTheDocument();
  });

  it.each([404, 400])("renders not found when the back answers %i", async (status) => {
    getProperty.mockRejectedValue(new ApiError(status, "nope"));

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("redirects to the login when the session expired", async () => {
    getProperty.mockRejectedValue(new ApiError(401, "Unauthorized"));

    await expectRedirect(renderPage(), "/admin/login?reason=expired");
  });
});

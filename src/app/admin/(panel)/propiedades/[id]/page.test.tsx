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

const { getSessionToken } = vi.hoisted(() => ({ getSessionToken: vi.fn() }));
vi.mock("@/lib/session/dal", () => ({ getSessionToken }));

vi.mock("./actions", () => ({ updatePropertyAction: vi.fn() }));

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
    expect(screen.getByText("Reservada")).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Casa en Palermo");
    expect(screen.getByRole("link", { name: /Volver al listado/ })).toHaveAttribute(
      "href",
      "/admin/propiedades",
    );
  });

  it("confirms a fresh creation and a saved edit", async () => {
    getProperty.mockResolvedValue(makePropertyDetail());

    render(await renderPage({ creada: "1" }));
    expect(screen.getByRole("status")).toHaveTextContent(/Propiedad creada/);
    cleanup();

    render(await renderPage({ guardada: "1" }));
    expect(screen.getByRole("status")).toHaveTextContent(/Cambios guardados/);
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

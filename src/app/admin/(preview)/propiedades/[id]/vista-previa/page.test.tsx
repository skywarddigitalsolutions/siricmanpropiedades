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

const { getProperty } = vi.hoisted(() => ({ getProperty: vi.fn() }));
vi.mock("@/lib/api/properties", () => ({ getProperty }));

const { getSessionToken } = vi.hoisted(() => ({ getSessionToken: vi.fn() }));
vi.mock("@/lib/session/dal", () => ({ getSessionToken }));

vi.mock("@/app/admin/(panel)/propiedades/[id]/lifecycle-actions", () => ({
  changePublicationAction: vi.fn(),
}));

import { ApiError } from "@/lib/api/client";
import PreviewPage, { metadata } from "./page";

function renderPage() {
  return PreviewPage({ params: Promise.resolve({ id: "p1" }) });
}

const IMAGE = {
  id: "i1",
  position: 0,
  url: "https://media.test/1.webp",
  width: 1600,
  height: 1200,
  thumbnailUrl: "https://media.test/1-t.webp",
  thumbnailWidth: 480,
  thumbnailHeight: 360,
  createdAt: "2024-01-01",
};

beforeEach(() => {
  vi.clearAllMocks();
  getSessionToken.mockResolvedValue("jwt-1");
});

afterEach(() => cleanup());

describe("PreviewPage", () => {
  it("renders the public listing for the property with the preview banner", async () => {
    getProperty.mockResolvedValue(
      makePropertyDetail({ images: [IMAGE], description: "x".repeat(80) }),
    );

    const { container } = render(await renderPage());

    expect(getProperty).toHaveBeenCalledWith("jwt-1", "p1");
    expect(screen.getByText("Vista previa — así la verán tus clientes")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Casa en Palermo" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeEnabled();
    // Only the banner's publish form exists: the inquiry form is not rendered.
    expect(container.querySelectorAll("form")).toHaveLength(1);
  });

  it("blocks publishing while the checklist is incomplete", async () => {
    getProperty.mockResolvedValue(makePropertyDetail({ images: [], description: null }));

    render(await renderPage());

    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
  });

  it("is never indexed", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
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

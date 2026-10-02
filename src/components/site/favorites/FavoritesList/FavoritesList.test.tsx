import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FAVORITES_KEY, readFavorites, type FavoriteSnapshot } from "@/lib/favorites/store";
import FavoritesList from "./FavoritesList";

function snap(slug: string, overrides: Partial<FavoriteSnapshot> = {}): FavoriteSnapshot {
  return {
    slug,
    title: `Propiedad ${slug}`,
    price: 100000,
    currency: "USD",
    operation: "sale",
    cover: null,
    neighborhood: "Palermo",
    savedAt: 1,
    ...overrides,
  };
}

const live = (slug: string, overrides = {}) => ({
  slug,
  status: "ok",
  property: {
    slug,
    code: "SP-1",
    title: `Propiedad ${slug}`,
    price: 100000,
    currency: "USD",
    operation: "sale",
    type: "apartment",
    neighborhood: { name: "Palermo", slug: "palermo" },
    coverImage: null,
    dealStatus: "available",
    ...overrides,
  },
});

function save(...items: FavoriteSnapshot[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
}

function mockRefresh(body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body)));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("FavoritesList", () => {
  it("shows the empty state with a call to action and never calls the API", async () => {
    const fetchMock = mockRefresh([]);
    render(<FavoritesList />);

    expect(await screen.findByText("Todavía no guardaste propiedades")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver propiedades" })).toHaveAttribute(
      "href",
      "/propiedades",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows skeletons while the refresh is pending, then the cards", async () => {
    save(snap("a"));
    let resolve!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((r) => (resolve = r))));
    render(<FavoritesList />);

    expect(await screen.findByRole("status", { name: "Cargando favoritos" })).toBeInTheDocument();

    resolve(new Response(JSON.stringify([live("a")])));
    expect(await screen.findByRole("link", { name: "Propiedad a" })).toHaveAttribute(
      "href",
      "/propiedades/a",
    );
    expect(screen.queryByRole("status", { name: "Cargando favoritos" })).toBeNull();
  });

  it("asks the same-origin route for the saved slugs", async () => {
    save(snap("a"), snap("b"));
    const fetchMock = mockRefresh([live("a"), live("b")]);
    render(<FavoritesList />);

    await screen.findByRole("link", { name: "Propiedad a" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]).toEqual([expect.stringMatching(/^\/api\/favoritos\?slugs=a(%2C|,)b$/), expect.anything()]);
  });

  it("shows sold properties muted with similares and quitar", async () => {
    save(snap("vendida"));
    mockRefresh([live("vendida", { dealStatus: "sold" })]);
    render(<FavoritesList />);

    const card = (await screen.findByRole("link", { name: "Propiedad vendida" })).closest("article")!;
    expect(within(card).getByText("Vendida")).toBeInTheDocument();
    expect(card).toHaveAttribute("data-state", "closed");
    expect(within(card).getByRole("link", { name: "Ver similares" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta&tipo=departamento&barrio=palermo",
    );
    expect(within(card).getByRole("button", { name: "Quitar" })).toBeInTheDocument();
  });

  it("shows gone properties as unavailable, without a link, and removes them", async () => {
    save(snap("borrada"));
    mockRefresh([{ slug: "borrada", status: "gone" }]);
    const user = userEvent.setup();
    render(<FavoritesList />);

    expect(await screen.findByText("Esta propiedad ya no está disponible")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Propiedad borrada" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Quitar" }));
    expect(readFavorites()).toEqual([]);
    expect(await screen.findByText("Todavía no guardaste propiedades")).toBeInTheDocument();
  });

  it("notes a price change against the snapshot", async () => {
    save(snap("a"));
    mockRefresh([live("a", { price: 90000 })]);
    render(<FavoritesList />);

    expect(await screen.findByText("Bajó de precio")).toBeInTheDocument();
    expect(screen.getByText("US$ 90.000")).toBeInTheDocument();
  });

  it("falls back to the saved snapshot when the refresh fails", async () => {
    save(snap("a"));
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    render(<FavoritesList />);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Propiedad a" })).toBeInTheDocument(),
    );
    expect(screen.getByText("US$ 100.000")).toBeInTheDocument();
  });
});

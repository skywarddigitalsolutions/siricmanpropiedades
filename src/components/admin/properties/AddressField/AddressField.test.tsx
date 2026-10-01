import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import AddressField from "./AddressField";

const fetchMock = vi.fn();
const neighborhoods = [
  { id: "n-almagro", name: "Almagro" },
  { id: "n-palermo", name: "Palermo" },
];

function Harness({
  initialNeighborhoodId = "",
  defaultAddress = "",
}: {
  initialNeighborhoodId?: string;
  defaultAddress?: string;
}) {
  const [neighborhoodId, setNeighborhoodId] = useState(initialNeighborhoodId);
  return (
    <form aria-label="f">
      <AddressField
        neighborhoods={neighborhoods}
        neighborhoodId={neighborhoodId}
        onNeighborhoodChange={setNeighborhoodId}
        defaultAddress={defaultAddress}
      />
      <output data-testid="barrio">{neighborhoodId}</output>
    </form>
  );
}

function json(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

const SUGGESTIONS = {
  suggestions: [
    { address: "Boedo 123", lat: -34.612817, lon: -58.417745 },
    { address: "Av. Boedo 1230", lat: -34.62, lon: -58.42 },
  ],
};

async function type(value: string) {
  fireEvent.change(screen.getByRole("combobox", { name: "Dirección" }), {
    target: { value },
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

function hiddenAddress(container: HTMLElement) {
  return container.querySelector('input[type="hidden"][name="address"]');
}

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AddressField", () => {
  it("does not search before 3 characters or before the 300ms debounce", async () => {
    fetchMock.mockImplementation(() => json(SUGGESTIONS));
    render(<Harness />);

    fireEvent.change(screen.getByRole("combobox", { name: "Dirección" }), {
      target: { value: "bo" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("combobox", { name: "Dirección" }), {
      target: { value: "boedo" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(fetchMock).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/admin/api/direcciones?q=boedo");
  });

  it("lists the suggestions as combobox options", async () => {
    fetchMock.mockImplementation(() => json(SUGGESTIONS));
    render(<Harness />);

    await type("boedo 123");

    expect(screen.getByRole("option", { name: "Boedo 123" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Av. Boedo 1230" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Dirección" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("choosing a suggestion validates the address, shows the map and submits it", async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes("lat=") ? json({ barrio: "Almagro" }) : json(SUGGESTIONS),
    );
    const { container } = render(<Harness />);

    await type("boedo 123");
    fireEvent.click(screen.getByRole("option", { name: "Boedo 123" }));
    await flush();

    expect(screen.getByRole("combobox", { name: "Dirección" })).toHaveValue("Boedo 123");
    expect(screen.getByText("Dirección validada en CABA")).toBeInTheDocument();
    expect(hiddenAddress(container)).toHaveValue("Boedo 123");
    const frame = screen.getByTitle("Mapa de la dirección");
    expect(frame.getAttribute("src")).toContain(
      encodeURIComponent("-34.612817,-58.417745"),
    );
  });

  it("pre-selects the barrio when it is empty", async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes("lat=") ? json({ barrio: "Almagro" }) : json(SUGGESTIONS),
    );
    render(<Harness />);

    await type("boedo 123");
    fireEvent.click(screen.getByRole("option", { name: "Boedo 123" }));
    await flush();

    expect(screen.getByTestId("barrio")).toHaveTextContent("n-almagro");
    expect(screen.getByText("Barrio completado: Almagro.")).toBeInTheDocument();
  });

  it("offers a one-tap apply when the barrio differs", async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes("lat=") ? json({ barrio: "Almagro" }) : json(SUGGESTIONS),
    );
    render(<Harness initialNeighborhoodId="n-palermo" />);

    await type("boedo 123");
    fireEvent.click(screen.getByRole("option", { name: "Boedo 123" }));
    await flush();

    expect(screen.getByTestId("barrio")).toHaveTextContent("n-palermo");
    fireEvent.click(screen.getByRole("button", { name: "Sí, usar Almagro" }));
    expect(screen.getByTestId("barrio")).toHaveTextContent("n-almagro");
    expect(screen.queryByText("¿Es en Almagro?")).not.toBeInTheDocument();
  });

  it("warns, without blocking, when the text was not picked from the list", async () => {
    fetchMock.mockImplementation(() => json({ suggestions: [] }));
    const { container } = render(<Harness />);

    await type("calle inventada 99");

    expect(
      screen.getByText("Elegí una dirección de la lista para validarla."),
    ).toBeInTheDocument();
    expect(hiddenAddress(container)).toHaveValue("calle inventada 99");
  });

  it("says it could not validate when USIG is unavailable and still lets the user save", async () => {
    fetchMock.mockImplementation(() => json({ suggestions: [], unavailable: true }));
    const { container } = render(<Harness />);

    await type("boedo 123");

    expect(screen.getByText(/No pudimos validar la dirección/)).toBeInTheDocument();
    expect(hiddenAddress(container)).toHaveValue("boedo 123");
  });

  it("appends the optional Piso/Depto to the submitted address", async () => {
    fetchMock.mockImplementation(() => json(SUGGESTIONS));
    const { container } = render(<Harness />);

    await type("boedo 123");
    fireEvent.click(screen.getByRole("option", { name: "Boedo 123" }));
    fireEvent.change(screen.getByLabelText("Piso / Depto (opcional)"), {
      target: { value: "4° B" },
    });

    expect(hiddenAddress(container)).toHaveValue("Boedo 123, 4° B");
  });

  it("splits an existing address into street and Piso/Depto and shows its map", () => {
    render(<Harness defaultAddress="Boedo 123, 4° B" />);

    expect(screen.getByRole("combobox", { name: "Dirección" })).toHaveValue("Boedo 123");
    expect(screen.getByLabelText("Piso / Depto (opcional)")).toHaveValue("4° B");
    expect(screen.getByTitle("Mapa de la dirección")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("supports keyboard selection (ArrowDown + Enter)", async () => {
    fetchMock.mockImplementation(() => json(SUGGESTIONS));
    render(<Harness />);

    await type("boedo 123");
    const input = screen.getByRole("combobox", { name: "Dirección" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(input).toHaveValue("Boedo 123");
  });
});

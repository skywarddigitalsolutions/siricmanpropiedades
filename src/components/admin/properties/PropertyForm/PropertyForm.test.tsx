import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Neighborhood, Property } from "@/lib/api/properties";
import {
  DEFAULT_FORM_VALUES,
  toFormValues,
  type PropertyFormValues,
} from "@/lib/properties/property-form";
import PropertyForm, { type PropertyFormState } from "./PropertyForm";

afterEach(() => {
  cleanup();
});

type Action = (
  prev: PropertyFormState,
  formData: FormData,
) => Promise<PropertyFormState>;

const NEIGHBORHOODS: Neighborhood[] = [
  { id: "n1", name: "Palermo", slug: "palermo", createdAt: "2024-01-01" },
  { id: "n2", name: "Belgrano", slug: "belgrano", createdAt: "2024-01-01" },
];

const PROPERTY: Property = {
  id: "p1",
  code: "SP-0001",
  slug: "casa-en-palermo",
  operation: "sale",
  type: "house",
  title: "Casa en Palermo",
  description: "Hermosa casa",
  neighborhood: { id: "n1", name: "Palermo", slug: "palermo", createdAt: "2024-01-01" },
  address: "Av. Siempre Viva 123",
  showExactAddress: true,
  currency: "USD",
  price: 150000,
  expenses: 25000,
  rooms: 4,
  bedrooms: 3,
  bathrooms: 2,
  hasGarage: true,
  coveredArea: 120,
  totalArea: 150,
  age: 10,
  creditEligible: false,
  petsAllowed: true,
  immediateAvailability: true,
  marketingTag: "none",
  featured: false,
  hasWater: true,
  hasNaturalGas: true,
  hasSewer: true,
  hasElectricity: true,
  hasInternet: true,
  publicationStatus: "published",
  dealStatus: "available",
  firstPublishedAt: "2024-02-01",
  createdAt: "2024-01-15",
  updatedAt: "2024-02-01",
};

function makeValues(overrides: Partial<PropertyFormValues> = {}): PropertyFormValues {
  return { ...DEFAULT_FORM_VALUES, ...overrides };
}

describe("PropertyForm", () => {
  it("groups the fields in labelled fieldsets", () => {
    const action: Action = vi.fn(async () => ({}));
    render(
      <PropertyForm mode="create" action={action} neighborhoods={NEIGHBORHOODS} />,
    );

    for (const legend of [
      "Operación y tipo",
      "Ubicación",
      "Precio",
      "Características",
      "Servicios",
      "Condiciones",
      "Destaque",
      "Descripción",
    ]) {
      expect(screen.getByRole("group", { name: legend })).toBeInTheDocument();
    }
  });

  it("lists the fetched neighborhoods in the barrio select", () => {
    const action: Action = vi.fn(async () => ({}));
    render(
      <PropertyForm mode="create" action={action} neighborhoods={NEIGHBORHOODS} />,
    );

    expect(screen.getByText("Palermo")).toBeInTheDocument();
    expect(screen.getByText("Belgrano")).toBeInTheDocument();
  });

  it("shows the create submit label and switches to the edit label", () => {
    const action: Action = vi.fn(async () => ({}));
    const { rerender } = render(
      <PropertyForm mode="create" action={action} neighborhoods={NEIGHBORHOODS} />,
    );
    expect(
      screen.getByRole("button", { name: "Crear propiedad" }),
    ).toBeInTheDocument();

    rerender(
      <PropertyForm mode="edit" action={action} neighborhoods={NEIGHBORHOODS} />,
    );
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeInTheDocument();
  });

  it("prefills every field from initialValues (edit mode defaults)", () => {
    const action: Action = vi.fn(async () => ({}));

    render(
      <PropertyForm
        mode="edit"
        action={action}
        neighborhoods={NEIGHBORHOODS}
        initialValues={toFormValues(PROPERTY)}
      />,
    );

    expect(screen.getByLabelText("Título")).toHaveValue("Casa en Palermo");
    expect(screen.getByLabelText("Dirección")).toHaveValue("Av. Siempre Viva 123");
    expect(screen.getByLabelText("Precio")).toHaveValue("150000");
    expect(screen.getByLabelText("Expensas")).toHaveValue("25000");
    expect(screen.getByLabelText("Tiene cochera")).toBeChecked();
    expect(screen.getByLabelText("Admite mascotas")).toBeChecked();
  });

  it("submits the form data to the action", async () => {
    const action: Action = vi.fn(async () => ({}));
    const user = userEvent.setup();
    render(
      <PropertyForm
        mode="create"
        action={action}
        neighborhoods={NEIGHBORHOODS}
        initialValues={toFormValues(PROPERTY)}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Crear propiedad" }));

    expect(action).toHaveBeenCalled();
    const [, formData] = (action as ReturnType<typeof vi.fn>).mock.calls[0] as [
      PropertyFormState,
      FormData,
    ];
    expect(formData.get("title")).toBe("Casa en Palermo");
    expect(formData.get("hasGarage")).toBe("on");
    expect(formData.get("featured")).toBeNull();
  });

  it("shows field errors next to the right field and a general FormAlert", async () => {
    const action: Action = vi.fn(async () => ({
      fieldErrors: { title: "El título es obligatorio.", general: "Revisá el formulario." },
      values: makeValues({ address: "Av. Corrientes 1000", operation: "rent" }),
    }));
    const user = userEvent.setup();
    render(
      <PropertyForm
        mode="create"
        action={action}
        neighborhoods={NEIGHBORHOODS}
        initialValues={toFormValues(PROPERTY)}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Crear propiedad" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Revisá el formulario.",
    );
    expect(screen.getByText("El título es obligatorio.")).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Dirección")).toHaveValue("Av. Corrientes 1000");
    // Focus jumps to the first invalid field so the user sees what to fix.
    await waitFor(() => expect(screen.getByLabelText("Título")).toHaveFocus());
    // Selects keep the submitted choice too (the form remounts with the returned values).
    expect(screen.getByLabelText("Operación")).toHaveValue("rent");
  });
});

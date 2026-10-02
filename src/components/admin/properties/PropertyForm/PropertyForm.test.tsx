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

const noop: Action = vi.fn(async () => ({}));

function renderForm(props: Partial<Parameters<typeof PropertyForm>[0]> = {}) {
  return render(
    <PropertyForm
      mode="create"
      step="datos"
      action={noop}
      neighborhoods={NEIGHBORHOODS}
      {...props}
    />,
  );
}

describe("PropertyForm step datos", () => {
  it("groups the required fields: operation and type, location, price, rooms and areas, title", () => {
    renderForm();

    for (const legend of [
      "Operación y tipo",
      "Ubicación",
      "Precio",
      "Ambientes y superficies",
      "Título del aviso",
    ]) {
      expect(screen.getByRole("group", { name: legend })).toBeInTheDocument();
    }
    // Services, conditions and description belong to step 3.
    expect(screen.queryByRole("group", { name: "Descripción" })).toBeNull();
    expect(screen.queryByLabelText("Admite mascotas")).toBeNull();
  });

  it("lists the fetched neighborhoods in the barrio select", () => {
    renderForm();

    expect(screen.getByText("Palermo")).toBeInTheDocument();
    expect(screen.getByText("Belgrano")).toBeInTheDocument();
  });

  it("shows Guardar y continuar when creating and Guardar cambios when editing", () => {
    const { rerender } = renderForm();
    expect(
      screen.getByRole("button", { name: "Guardar y continuar" }),
    ).toBeInTheDocument();

    rerender(
      <PropertyForm
        mode="edit"
        step="datos"
        action={noop}
        neighborhoods={NEIGHBORHOODS}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeInTheDocument();
  });

  it("starts a new property in USD", () => {
    renderForm();

    expect(screen.getByLabelText("Moneda")).toHaveValue("USD");
  });

  it("shows the currency symbol next to the price and follows the chosen currency", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getByLabelText("Precio").parentElement).toHaveTextContent("US$");
    await user.selectOptions(screen.getByLabelText("Moneda"), "ARS");
    expect(screen.getByLabelText("Precio").parentElement).not.toHaveTextContent("US$");
  });

  it("switches the currency to ARS for rent until the user picks one manually", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText("Operación"), "rent");
    expect(screen.getByLabelText("Moneda")).toHaveValue("ARS");

    await user.selectOptions(screen.getByLabelText("Operación"), "sale");
    expect(screen.getByLabelText("Moneda")).toHaveValue("USD");

    await user.selectOptions(screen.getByLabelText("Moneda"), "ARS");
    await user.selectOptions(screen.getByLabelText("Operación"), "rent");
    await user.selectOptions(screen.getByLabelText("Operación"), "sale");
    expect(screen.getByLabelText("Moneda")).toHaveValue("ARS");
  });

  it("suggests the title from type, rooms and barrio, and stops once the user edits it", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText("Tipo de propiedad"), "apartment");
    await user.selectOptions(screen.getByLabelText("Barrio"), "n1");
    await user.type(screen.getByLabelText("Ambientes"), "3");
    expect(screen.getByLabelText("Título")).toHaveValue(
      "Departamento 3 ambientes en Palermo",
    );

    await user.type(screen.getByLabelText("Título"), " luminoso");
    await user.selectOptions(screen.getByLabelText("Barrio"), "n2");
    expect(screen.getByLabelText("Título")).toHaveValue(
      "Departamento 3 ambientes en Palermo luminoso",
    );
  });

  it("does not suggest a title when editing an existing property", () => {
    renderForm({
      mode: "edit",
      initialValues: toFormValues(PROPERTY),
    });

    expect(screen.getByLabelText("Título")).toHaveValue("Casa en Palermo");
  });

  it("prefills every step-1 field from initialValues (edit mode)", () => {
    renderForm({ mode: "edit", initialValues: toFormValues(PROPERTY) });

    expect(screen.getByLabelText("Título")).toHaveValue("Casa en Palermo");
    expect(screen.getByLabelText("Dirección")).toHaveValue("Av. Siempre Viva 123");
    expect(screen.getByLabelText("Precio")).toHaveValue("150000");
    expect(screen.getByLabelText("Expensas")).toHaveValue("25000");
    expect(screen.getByLabelText("Tiene cochera")).toBeChecked();
    expect(screen.getByLabelText("Barrio")).toHaveValue("n1");
  });

  it("submits the form data to the action", async () => {
    const action: Action = vi.fn(async () => ({}));
    const user = userEvent.setup();
    renderForm({ action, initialValues: toFormValues(PROPERTY) });

    await user.click(screen.getByRole("button", { name: "Guardar y continuar" }));

    expect(action).toHaveBeenCalled();
    const [, formData] = (action as ReturnType<typeof vi.fn>).mock.calls[0] as [
      PropertyFormState,
      FormData,
    ];
    expect(formData.get("title")).toBe("Casa en Palermo");
    expect(formData.get("address")).toBe("Av. Siempre Viva 123");
    expect(formData.get("neighborhoodId")).toBe("n1");
    expect(formData.get("hasGarage")).toBe("on");
    expect(formData.get("currency")).toBe("USD");
  });

  it("shows field errors next to the right field and a general FormAlert", async () => {
    const action: Action = vi.fn(async () => ({
      fieldErrors: { title: "El título es obligatorio.", general: "Revisá el formulario." },
      values: makeValues({ address: "Av. Corrientes 1000", operation: "rent" }),
    }));
    const user = userEvent.setup();
    renderForm({ action, initialValues: toFormValues(PROPERTY) });

    await user.click(screen.getByRole("button", { name: "Guardar y continuar" }));

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

describe("PropertyForm step extras", () => {
  it("shows the description and collapsible optional groups", () => {
    renderForm({ mode: "edit", step: "extras" });

    expect(screen.getByRole("group", { name: "Descripción" })).toBeInTheDocument();
    for (const summary of ["Servicios", "Condiciones", "Destacar el aviso"]) {
      expect(screen.getByText(summary).closest("details")).not.toBeNull();
    }
    // Step 1 fields are not part of this form.
    expect(screen.queryByLabelText("Precio")).toBeNull();
    expect(screen.queryByLabelText("Título")).toBeNull();
  });

  it("keeps the optional groups collapsed unless something is set, and opens them when it is", () => {
    const { unmount } = renderForm({
      mode: "edit",
      step: "extras",
      initialValues: makeValues(),
    });
    expect(screen.getByText("Servicios").closest("details")).not.toHaveAttribute("open");
    unmount();

    renderForm({
      mode: "edit",
      step: "extras",
      initialValues: toFormValues(PROPERTY),
    });
    expect(screen.getByText("Servicios").closest("details")).toHaveAttribute("open");
    expect(screen.getByText("Condiciones").closest("details")).toHaveAttribute("open");
  });

  it("counts description characters and says how many are missing to publish", async () => {
    const user = userEvent.setup();
    renderForm({ mode: "edit", step: "extras", initialValues: makeValues() });

    expect(screen.getByText("0 / 5000")).toBeInTheDocument();
    expect(screen.getByText(/Te faltan 50 caracteres para poder publicar/)).toBeInTheDocument();

    await user.type(screen.getByLabelText("Descripción"), "x".repeat(20));
    expect(screen.getByText("20 / 5000")).toBeInTheDocument();
    expect(screen.getByText(/Te faltan 30 caracteres/)).toBeInTheDocument();

    await user.type(screen.getByLabelText("Descripción"), "x".repeat(30));
    expect(screen.queryByText(/Te faltan/)).toBeNull();
  });

  it("submits the extras fields", async () => {
    const action: Action = vi.fn(async () => ({}));
    const user = userEvent.setup();
    renderForm({
      mode: "edit",
      step: "extras",
      action,
      initialValues: toFormValues(PROPERTY),
    });

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    const [, formData] = (action as ReturnType<typeof vi.fn>).mock.calls[0] as [
      PropertyFormState,
      FormData,
    ];
    expect(formData.get("description")).toBe("Hermosa casa");
    expect(formData.get("petsAllowed")).toBe("on");
    expect(formData.get("featured")).toBeNull();
    expect(formData.get("marketingTag")).toBe("none");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

vi.mock("./actions", () => ({ sendRentalAction: vi.fn() }));

import { WHATSAPP_PHONE } from "@/lib/whatsapp";
import RentalManagementPage, { metadata } from "./page";

afterEach(() => cleanup());

describe("RentalManagementPage", () => {
  it("introduces the service and points the primary call to action at the form", () => {
    render(<RentalManagementPage />);

    expect(screen.getByText("ADMINISTRACIÓN DE ALQUILERES")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Tu propiedad alquilada, sin preocupaciones" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Cobramos el alquiler, te rendimos cuentas todos los meses y nos ocupamos del inquilino, para que vos no tengas que hacerlo.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quiero que administren mi alquiler" })).toHaveAttribute(
      "href",
      "#consulta",
    );
    expect(document.getElementById("consulta")).not.toBeNull();
  });

  it("offers a WhatsApp link with a prefilled rental management message", () => {
    render(<RentalManagementPage />);

    const link = screen.getByRole("link", { name: /Escribinos por WhatsApp/ });
    const href = new URL(link.getAttribute("href")!);
    expect(href.pathname).toBe(`/${WHATSAPP_PHONE}`);
    expect(href.searchParams.get("text")).toBe(
      "Hola Gabriel, quiero consultar por la administración de mi alquiler.",
    );
  });

  it("shows the three highlights with Gabriel's license and no invented figures", () => {
    render(<RentalManagementPage />);

    const card = screen.getByRole("complementary", { name: "Datos de la administración" });
    expect(within(card).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Trato directo con Gabriel Siricman",
      "Rendición de cuentas mensual",
      "Corredor inmobiliario matriculado · Matrícula N° 10024",
    ]);
    expect(screen.queryByText(/\d+ años|\+\d+/)).toBeNull();
    expect(screen.queryByText(/Ana María/)).toBeNull();
  });

  it("lists what the administration includes in three groups", () => {
    render(<RentalManagementPage />);

    const section = screen.getByRole("region", { name: "Qué incluye" });
    const groups = within(section).getAllByRole("heading", { level: 3 });
    expect(groups.map((group) => group.textContent)).toEqual([
      "Cobranza",
      "Contrato",
      "Inquilino y propiedad",
    ]);
    const items = within(section).getAllByRole("listitem").filter((item) => item.closest("ul ul"));
    expect(items).toHaveLength(9);
    expect(within(section).getByText("Rendición de cuentas con comprobantes")).toBeInTheDocument();
    expect(within(section).getByText("Entrega y recepción de la propiedad")).toBeInTheDocument();
  });

  it("explains the handover in four steps", () => {
    render(<RentalManagementPage />);

    const section = screen.getByRole("region", { name: "Cómo trabajamos" });
    expect(
      within(section).getByRole("heading", {
        name: "Pasar tu alquiler a nuestra administración es simple",
      }),
    ).toBeInTheDocument();
    expect(within(section).getAllByRole("listitem").map((step) => step.textContent)).toEqual([
      "1ConversamosNos contás sobre tu propiedad y el contrato vigente.",
      "2Te presentamos la propuestaTe explicamos cómo trabajamos y qué incluye la administración.",
      "3Hacemos el traspasoNos presentamos con el inquilino y ordenamos la documentación.",
      "4Gestión mes a mesCobramos, te rendimos cuentas y te mantenemos al tanto.",
    ]);
  });

  it("invites owners who have not rented yet to the form", () => {
    render(<RentalManagementPage />);

    expect(screen.getByText("¿Todavía no la alquilaste?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "También buscamos inquilinos y armamos el contrato. Después, si querés, seguimos administrándola.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Consultanos" })).toHaveAttribute("href", "#consulta");
  });

  it("answers the frequent questions with native disclosures", () => {
    render(<RentalManagementPage />);

    const section = screen.getByRole("region", { name: "Preguntas frecuentes" });
    expect(section.querySelectorAll("details")).toHaveLength(4);
    expect(
      within(section).getByText("¿Puedo pasar a su administración con un contrato ya firmado?", {
        selector: "summary",
      }),
    ).toBeInTheDocument();
    expect(within(section).getByText(/Depende de la propiedad y del contrato/)).toBeInTheDocument();
  });

  it("ends with the consultation form", () => {
    render(<RentalManagementPage />);

    const section = document.getElementById("consulta")!;
    expect(within(section).getByText("CONSULTA")).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", { name: "Contanos de tu propiedad" }),
    ).toBeInTheDocument();
    expect(within(section).getByLabelText("Dirección de la propiedad")).toBeInTheDocument();
    expect(
      within(section).getByRole("button", { name: "Quiero que la administren" }),
    ).toBeInTheDocument();
  });

  it("sets the title, description and canonical", () => {
    expect(metadata.title).toBe("Administración de alquileres");
    expect(metadata.description).toBe(
      "Administración de alquileres en CABA: cobranza mensual, rendición de cuentas, ajustes de contrato, renovaciones y relación con el inquilino. Dejá tu alquiler en manos de un corredor matriculado.",
    );
    expect(metadata.alternates).toEqual({ canonical: "/administracion-de-alquileres" });
  });
});

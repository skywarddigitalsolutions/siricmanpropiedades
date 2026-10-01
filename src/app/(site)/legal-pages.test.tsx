import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PrivacyPage, { metadata as privacyMetadata } from "./privacidad/page";
import TermsPage, { metadata as termsMetadata } from "./terminos/page";
import { CONTACT_EMAIL } from "@/lib/contact";

afterEach(() => cleanup());

describe("PrivacyPage", () => {
  it("states who is responsible, what is collected, the rights and the contact", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Política de privacidad" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Responsable del tratamiento" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Datos que recopilamos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tus derechos" })).toBeInTheDocument();
    expect(screen.getAllByText(/Ley 25\.326/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Agencia de Acceso a la Información Pública/)).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: CONTACT_EMAIL })) {
      expect(link).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);
    }
  });

  it("sets its own title and canonical", () => {
    expect(privacyMetadata.title).toBe("Política de privacidad");
    expect(privacyMetadata.alternates?.canonical).toBe("/privacidad");
  });
});

describe("TermsPage", () => {
  it("covers the use of the site, the indicative information and the governing law", () => {
    render(<TermsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Términos y condiciones" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Uso del sitio" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Información de las propiedades" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ley aplicable" })).toBeInTheDocument();
  });

  it("sets its own title and canonical", () => {
    expect(termsMetadata.title).toBe("Términos y condiciones");
    expect(termsMetadata.alternates?.canonical).toBe("/terminos");
  });
});

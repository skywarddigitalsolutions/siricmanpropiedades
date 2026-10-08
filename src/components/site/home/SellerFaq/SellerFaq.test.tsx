import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import SellerFaq from "./SellerFaq";

afterEach(() => cleanup());

const TITLE = "Lo que preguntan los propietarios antes de vender";

const FAQ = [
  [
    "¿Cuánto vale mi propiedad?",
    "Lo definimos con una tasación: visitamos la propiedad y la comparamos con operaciones reales de la zona. Te entregamos un valor sugerido con fundamentos.",
  ],
  [
    "¿Pedir una tasación me obliga a vender con ustedes?",
    "No. Te damos el informe y vos decidís si avanzás con nosotros.",
  ],
  [
    "¿Qué documentación necesito para vender?",
    "Escritura, datos de los titulares, últimos impuestos y expensas pagos. Te ayudamos a reunir lo que falte.",
  ],
  [
    "¿Cómo se muestra mi propiedad?",
    "Con fotos cuidadas, una descripción clara y publicación en portales y en nuestros canales. Las visitas las coordinamos nosotros.",
  ],
] as const;

describe("SellerFaq", () => {
  it("is a section named by its heading, with an eyebrow", () => {
    render(<SellerFaq />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).getByRole("heading", { level: 2, name: TITLE })).toBeInTheDocument();
    expect(within(section).getByText("PREGUNTAS FRECUENTES")).toBeInTheDocument();
  });

  it("renders each question as a closed details element with its answer", () => {
    const { container } = render(<SellerFaq />);

    const items = Array.from(container.querySelectorAll("details"));
    expect(items).toHaveLength(FAQ.length);
    items.forEach((item, index) => {
      const [question, answer] = FAQ[index];
      expect(item).not.toHaveAttribute("open");
      expect(within(item).getByText(question)).toBeInTheDocument();
      expect(item.querySelector("summary")).toHaveTextContent(question);
      expect(within(item).getByText(answer)).toBeInTheDocument();
    });
  });
});

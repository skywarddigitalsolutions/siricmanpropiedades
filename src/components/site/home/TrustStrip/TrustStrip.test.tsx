import { afterEach, describe, expect, it } from "vitest";
import { cleanup, isInaccessible, render, screen, within } from "@testing-library/react";
import { BROKER_LICENSE } from "@/lib/contact";
import TrustStrip from "./TrustStrip";

afterEach(() => cleanup());

describe("TrustStrip", () => {
  it("is a labelled list of four trust signals, each a title and a short detail", () => {
    render(<TrustStrip />);

    const list = screen.getByRole("list", { name: "Por qué confiar en nosotros" });
    const items = within(list).getAllByRole("listitem");
    expect(
      items.map((item) => [
        item.querySelector("strong")?.textContent,
        item.querySelector("strong + span")?.textContent,
      ]),
    ).toEqual([
      ["Corredor matriculado", BROKER_LICENSE],
      ["Trato directo", "Sin intermediarios"],
      ["Hasta la escritura", "Con vos en cada paso"],
      ["Oficina en Boedo", "CABA · con cita previa"],
    ]);
    expect(BROKER_LICENSE).toBe("Matrícula N° 10024");
  });

  it("hides the decorative icons from assistive tech", () => {
    render(<TrustStrip />);

    const icons = document.querySelectorAll("svg");
    expect(icons).toHaveLength(4);
    icons.forEach((icon) => expect(isInaccessible(icon)).toBe(true));
  });
});

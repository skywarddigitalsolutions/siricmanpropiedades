import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { FOUNDER } from "@/lib/public/team";
import AboutTeaser from "./AboutTeaser";

afterEach(() => cleanup());

const TITLE = "Una inmobiliaria con nombre y apellido";

describe("AboutTeaser", () => {
  it("is a section named by its heading, with an eyebrow", () => {
    render(<AboutTeaser />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).getByRole("heading", { level: 2, name: TITLE })).toBeInTheDocument();
    expect(within(section).getByText("QUIÉNES SOMOS")).toBeInTheDocument();
  });

  it("shows the founder's photo, named by the founder", () => {
    render(<AboutTeaser />);

    const section = screen.getByRole("region", { name: TITLE });
    const photo = within(section).getByRole("img", { name: FOUNDER.name });
    expect(decodeURIComponent(photo.getAttribute("src")!)).toContain(FOUNDER.photo);
  });

  it("renders the founder's bio, name and role from the shared team data", () => {
    render(<AboutTeaser />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).getByText(FOUNDER.bio)).toBeInTheDocument();
    expect(within(section).getByText(FOUNDER.name)).toBeInTheDocument();
    expect(within(section).getByText(FOUNDER.role)).toBeInTheDocument();
  });

  it("links to the about page", () => {
    render(<AboutTeaser />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(
      within(section).getByRole("link", { name: "Conocé más sobre nosotros" }),
    ).toHaveAttribute("href", "/nosotros");
  });
});

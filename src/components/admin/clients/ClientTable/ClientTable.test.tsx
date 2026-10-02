import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { Client } from "@/lib/api/clients";
import ClientTable from "./ClientTable";

afterEach(cleanup);

const NOW = new Date("2026-10-02T12:00:00Z");

const CLIENT: Client = {
  name: "Ana García",
  email: "ana@mail.com",
  phone: "11 3896-7363",
  inquiries: 1,
  firstInquiryAt: "2026-09-01T01:00:00Z",
  lastInquiryAt: "2026-10-02T01:00:00Z",
  properties: [{ id: "p1", code: "SP-0101", title: "PH en Boedo" }],
};

function rowOf(client: Client) {
  render(<ClientTable clients={[client]} now={NOW} />);
  return screen.getByRole("row", { name: /Ana García/ });
}

describe("ClientTable spacing structure", () => {
  it("stacks name and email in separate elements", () => {
    const row = rowOf(CLIENT);

    const name = within(row).getByText("Ana García");
    const email = within(row).getByRole("link", { name: "ana@mail.com" });
    expect(name.parentElement).toBe(email.parentElement);
    expect(name.contains(email)).toBe(false);
  });

  it("puts the phone on its own line above the WhatsApp and Llamar buttons", () => {
    const row = rowOf(CLIENT);

    const phone = within(row).getByText("11 3896-7363");
    const whatsapp = within(row).getByRole("link", { name: "WhatsApp" });
    const call = within(row).getByRole("link", { name: "Llamar" });
    expect(whatsapp.parentElement).toBe(call.parentElement);
    expect(phone.parentElement).toBe(whatsapp.parentElement!.parentElement);
    expect(phone.contains(whatsapp)).toBe(false);
  });

  it("keeps the inquiry count and its link as separate stacked items", () => {
    const row = rowOf(CLIENT);

    const count = within(row).getByText("1 consulta");
    const link = within(row).getByRole("link", { name: "Ver consultas" });
    expect(count.parentElement).toBe(link.parentElement);
  });

  it("keeps the relative and the absolute date as separate stacked items", () => {
    const row = rowOf(CLIENT);

    const relative = row.querySelector("time")!;
    expect(relative).toHaveTextContent(/hace/);
    const absolute = relative.nextElementSibling!;
    expect(absolute.textContent).not.toBe("");
    expect(relative.contains(absolute)).toBe(false);
  });
});

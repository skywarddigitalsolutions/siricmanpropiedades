import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PublicationStatusBadge from "@/components/admin/properties/PublicationStatusBadge/PublicationStatusBadge";
import DealStatusBadge from "@/components/admin/properties/DealStatusBadge/DealStatusBadge";
import LeadStatusBadge from "@/components/admin/leads/LeadStatusBadge/LeadStatusBadge";

afterEach(cleanup);

describe("status badge tones", () => {
  it.each([
    ["draft", "Borrador", "warning"],
    ["published", "Publicada", "success"],
    ["archived", "Archivada", "neutral"],
  ] as const)("publication %s is %s", (status, label, tone) => {
    render(<PublicationStatusBadge status={status} />);
    expect(screen.getByText(label)).toHaveAttribute("data-tone", tone);
  });

  it.each([
    ["available", "Disponible", "success"],
    ["reserved", "Reservada", "warning"],
    ["sold", "Vendida", "danger"],
    ["rented", "Alquilada", "info"],
  ] as const)("deal %s is %s", (status, label, tone) => {
    render(<DealStatusBadge status={status} />);
    expect(screen.getByText(label)).toHaveAttribute("data-tone", tone);
  });

  it.each([
    ["new", "Nueva", "info"],
    ["contacted", "Contactada", "warning"],
    ["closed", "Cerrada", "neutral"],
  ] as const)("lead %s is %s", (status, label, tone) => {
    render(<LeadStatusBadge status={status} />);
    expect(screen.getByText(label)).toHaveAttribute("data-tone", tone);
  });
});

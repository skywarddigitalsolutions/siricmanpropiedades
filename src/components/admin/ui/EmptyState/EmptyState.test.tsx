import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Inbox } from "lucide-react";
import EmptyState from "./EmptyState";

afterEach(cleanup);

describe("EmptyState", () => {
  it("shows an icon, the title, a description and the call to action", () => {
    const { container } = render(
      <EmptyState icon={Inbox} title="No hay consultas" description="Probá otro filtro.">
        <button type="button">Ver todas</button>
      </EmptyState>,
    );

    expect(screen.getByText("No hay consultas")).toBeInTheDocument();
    expect(screen.getByText("Probá otro filtro.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver todas" })).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});

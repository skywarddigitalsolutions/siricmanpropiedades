import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FormNotice from "./FormNotice";

describe("FormNotice", () => {
  it("announces a success message politely", () => {
    render(<FormNotice>Cambios guardados.</FormNotice>);

    expect(screen.getByRole("status")).toHaveTextContent("Cambios guardados.");
  });
});

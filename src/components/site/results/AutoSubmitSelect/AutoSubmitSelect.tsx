"use client";

import type { ComponentProps } from "react";
import Select from "../../Select/Select";

/** A `<Select>` that submits its form on change; pair it with a `<noscript>` submit button. */
export default function AutoSubmitSelect(props: ComponentProps<typeof Select>) {
  return (
    <Select {...props} onChange={(event) => event.currentTarget.form?.requestSubmit()} />
  );
}

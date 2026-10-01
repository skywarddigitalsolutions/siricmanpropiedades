"use client";

import type { SelectHTMLAttributes } from "react";

/** A `<select>` that submits its form on change; pair it with a `<noscript>` submit button. */
export default function AutoSubmitSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} onChange={(event) => event.currentTarget.form?.requestSubmit()} />
  );
}

"use client";

import { useState, useTransition } from "react";
import type { ActionFeedback } from "@/lib/forms/action-feedback";

export type UpdateLeadAction = (prev: ActionFeedback, formData: FormData) => Promise<ActionFeedback>;

/**
 * Runs `updateLeadAction` (bound to a lead) with `status=contacted` inside a
 * transition, so the page refresh it triggers keeps the UI responsive, and
 * keeps the error to show when it fails.
 */
export function useMarkContacted(updateAction: UpdateLeadAction) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function markContacted() {
    const formData = new FormData();
    formData.set("status", "contacted");
    startTransition(async () => {
      const result = await updateAction({}, formData);
      setError(result.error);
    });
  }

  return { markContacted, pending, error };
}

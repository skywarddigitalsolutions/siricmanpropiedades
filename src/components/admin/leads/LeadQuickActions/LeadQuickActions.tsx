"use client";

import { useState, useTransition } from "react";
import { CheckCheck } from "lucide-react";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import type { LeadStatus } from "@/lib/leads/labels";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import styles from "./LeadQuickActions.module.css";

type LeadQuickActionsProps = {
  status: LeadStatus;
  /** Prefilled chat link; absent when the lead left no phone. */
  whatsappHref?: string;
  /** `updateLeadAction` bound to the lead id. */
  updateAction: (prev: ActionFeedback, formData: FormData) => Promise<ActionFeedback>;
};

/**
 * Inbox row shortcuts. WhatsApp is a real `target="_blank"` link, so the
 * browser opens the chat itself (no popup blocker, no inline script under the
 * strict CSP); for a new lead its click handler also marks it as contacted.
 */
export default function LeadQuickActions({
  status,
  whatsappHref,
  updateAction,
}: LeadQuickActionsProps) {
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

  return (
    <div className={styles.actions}>
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.button} ${styles.whatsapp}`}
          onClick={status === "new" ? markContacted : undefined}
        >
          <WhatsAppIcon size={18} />
          <span className={styles.label}>WhatsApp</span>
        </a>
      )}
      {status === "new" && (
        <button
          type="button"
          className={styles.button}
          onClick={markContacted}
          disabled={pending}
          title="Marcar como contactada"
        >
          <CheckCheck aria-hidden size={18} />
          <span className={styles.visuallyHidden}>Marcar como contactada</span>
        </button>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

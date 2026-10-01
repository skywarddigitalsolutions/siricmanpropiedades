"use client";

import { CheckCheck } from "lucide-react";
import type { LeadStatus } from "@/lib/leads/labels";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import { useMarkContacted, type UpdateLeadAction } from "../use-mark-contacted";
import styles from "./LeadQuickActions.module.css";

type LeadQuickActionsProps = {
  status: LeadStatus;
  /** Prefilled chat link; absent when the lead left no phone. */
  whatsappHref?: string;
  /** `updateLeadAction` bound to the lead id. */
  updateAction: UpdateLeadAction;
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
  const { markContacted, pending, error } = useMarkContacted(updateAction);

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

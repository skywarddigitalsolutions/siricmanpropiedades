"use client";

import type { LeadStatus } from "@/lib/leads/labels";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import { useMarkContacted, type UpdateLeadAction } from "../use-mark-contacted";
import styles from "./WhatsAppReplyLink.module.css";

type WhatsAppReplyLinkProps = {
  status: LeadStatus;
  /** Chat link prefilled with a greeting. */
  href: string;
  /** `updateLeadAction` bound to the lead id. */
  updateAction: UpdateLeadAction;
};

/**
 * The primary way to answer a lead: opens the prefilled WhatsApp chat in a new
 * tab (a real link, so no popup blocker or inline script) and, for a new
 * lead, marks it as contacted in the same tap.
 */
export default function WhatsAppReplyLink({ status, href, updateAction }: WhatsAppReplyLinkProps) {
  const { markContacted, error } = useMarkContacted(updateAction);

  return (
    <div className={styles.wrapper}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
        onClick={status === "new" ? markContacted : undefined}
      >
        <WhatsAppIcon size={22} />
        Responder por WhatsApp
      </a>
      {status === "new" && (
        <span className={styles.hint}>Al abrirlo, la consulta pasa a contactada.</span>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

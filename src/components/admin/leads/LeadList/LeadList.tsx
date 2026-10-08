import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import type { Lead } from "@/lib/api/leads";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import { leadCategory } from "@/lib/leads/category";
import { leadContactLinks } from "@/lib/leads/contact-links";
import { formatLeadDate, leadSummary } from "@/lib/leads/inbox-params";
import LeadCategoryTag from "../LeadCategoryTag/LeadCategoryTag";
import LeadQuickActions from "../LeadQuickActions/LeadQuickActions";
import LeadStatusBadge from "../LeadStatusBadge/LeadStatusBadge";
import styles from "./LeadList.module.css";

type LeadListProps = {
  leads: Lead[];
  /** `updateLeadAction` as exported by the server actions file; bound to each lead here. */
  updateAction: (
    id: string,
    prev: ActionFeedback,
    formData: FormData,
  ) => Promise<ActionFeedback>;
};

/**
 * Inbox rows: category tag, who and when, what about (property code chip), how to reach
 * them, a message preview, the status and quick actions. The name is the link
 * to the detail (stretched over the card); the actions sit above it.
 */
export default function LeadList({ leads, updateAction }: LeadListProps) {
  return (
    <ul className={styles.list}>
      {leads.map((lead) => {
        const category = leadCategory(lead);
        return (
          <li
            key={lead.id}
            aria-label={lead.name}
            className={styles.row}
            data-category={category}
            data-new={lead.status === "new" ? "" : undefined}
          >
            <LeadCategoryTag category={category} />
            <div className={styles.top}>
              <Link
                href={`/admin/consultas/${lead.id}`}
                className={styles.name}
              >
                {lead.name}
              </Link>
              <time dateTime={lead.createdAt} className={styles.date}>
                {formatLeadDate(lead.createdAt)}
              </time>
            </div>
            {lead.property ? (
              <span className={styles.chip} title={lead.property.title}>
                {lead.property.code}
              </span>
            ) : (
              <span className={styles.summary}>{leadSummary(lead)}</span>
            )}
            {(lead.phone || lead.email) && (
              <div className={styles.contact}>
                {lead.phone && (
                  <span className={styles.contactItem}>
                    <Phone aria-hidden size={14} />
                    {lead.phone}
                  </span>
                )}
                {lead.email && (
                  <span className={styles.contactItem}>
                    <Mail aria-hidden size={14} />
                    {lead.email}
                  </span>
                )}
              </div>
            )}
            {lead.message && <p className={styles.preview}>{lead.message}</p>}
            <div className={styles.footer}>
              <LeadStatusBadge status={lead.status} />
              <div className={styles.actions}>
                <LeadQuickActions
                  status={lead.status}
                  whatsappHref={leadContactLinks(lead).whatsapp}
                  updateAction={updateAction.bind(null, lead.id)}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

import Link from "next/link";
import type { Lead } from "@/lib/api/leads";
import { formatLeadDate, leadSummary } from "@/lib/leads/inbox-params";
import LeadStatusBadge from "../LeadStatusBadge/LeadStatusBadge";
import styles from "./LeadList.module.css";

/** Inbox rows: who, what about, a message preview and when. New leads stand out. */
export default function LeadList({ leads }: { leads: Lead[] }) {
  return (
    <ul className={styles.list}>
      {leads.map((lead) => (
        <li key={lead.id}>
          <Link
            href={`/admin/consultas/${lead.id}`}
            className={styles.row}
            data-new={lead.status === "new" ? "" : undefined}
          >
            <span className={styles.top}>
              <span className={styles.name}>{lead.name}</span>
              <time dateTime={lead.createdAt} className={styles.date}>
                {formatLeadDate(lead.createdAt)}
              </time>
            </span>
            <span className={styles.summary}>{leadSummary(lead)}</span>
            {lead.message && <span className={styles.preview}>{lead.message}</span>}
            <span className={styles.meta}>
              <LeadStatusBadge status={lead.status} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

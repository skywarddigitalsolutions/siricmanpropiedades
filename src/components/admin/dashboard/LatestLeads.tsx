import Link from "next/link";
import { Inbox } from "lucide-react";
import type { DashboardSummary } from "@/lib/api/dashboard";
import { buildInboxHref, formatLeadDate } from "@/lib/leads/inbox-params";
import { leadCategory } from "@/lib/leads/category";
import LeadCategoryTag from "@/components/admin/leads/LeadCategoryTag/LeadCategoryTag";
import LeadStatusBadge from "@/components/admin/leads/LeadStatusBadge/LeadStatusBadge";
import EmptyState from "@/components/admin/ui/EmptyState/EmptyState";
import styles from "./LatestLeads.module.css";

type LatestLeadsProps = {
  leads: DashboardSummary["latestLeads"];
};

/** "Últimas consultas": the newest leads with category tag, status, property code chip and a link to each detail. */
export default function LatestLeads({ leads }: LatestLeadsProps) {
  return (
    <section aria-labelledby="latest-leads-title" className={styles.section}>
      <div className={styles.header}>
        <h2 id="latest-leads-title" className={styles.title}>
          Últimas consultas
        </h2>
        {leads.length > 0 && (
          <Link
            href={buildInboxHref({ status: "all", page: 1 })}
            className={styles.all}
          >
            Ver todas
          </Link>
        )}
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Todavía no llegó ninguna consulta."
          description="Cuando alguien escriba desde el sitio, la vas a ver acá."
        />
      ) : (
        <ul className={styles.list}>
          {leads.map((lead) => (
            <li key={lead.id} className={styles.row}>
              <div className={styles.main}>
                <Link href={`/admin/consultas/${lead.id}`} className={styles.name}>
                  {lead.name}
                </Link>
                <span className={styles.meta}>
                  <LeadCategoryTag category={leadCategory(lead)} />
                  {lead.property && (
                    <span className={styles.chip} title={lead.property.title}>
                      {lead.property.code}
                    </span>
                  )}
                  <time dateTime={lead.createdAt}>{formatLeadDate(lead.createdAt)}</time>
                </span>
              </div>
              <LeadStatusBadge status={lead.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import Link from "next/link";
import {
  buildInboxHref,
  type InboxState,
  type InboxStatus,
} from "@/lib/leads/inbox-params";
import type { LeadType } from "@/lib/leads/labels";
import styles from "./InboxFilters.module.css";

const STATUS_TABS: { label: string; status: InboxStatus }[] = [
  { label: "Nuevas", status: "new" },
  { label: "Contactadas", status: "contacted" },
  { label: "Cerradas", status: "closed" },
  { label: "Todas", status: "all" },
];

const TYPE_CHIPS: { label: string; type?: LeadType }[] = [
  { label: "Todos los tipos" },
  { label: "Propiedades", type: "property_inquiry" },
  { label: "Tasaciones", type: "appraisal" },
  { label: "Contacto", type: "contact" },
];

/** Status tabs and type chips; plain links, so the URL keeps the inbox state. */
export default function InboxFilters({ state }: { state: InboxState }) {
  return (
    <div className={styles.filters}>
      <nav aria-label="Estado" className={styles.tabs}>
        {STATUS_TABS.map(({ label, status }) => (
          <Link
            key={status}
            href={buildInboxHref(state, { status })}
            aria-current={state.status === status ? "page" : undefined}
            className={styles.tab}
          >
            {label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Tipo" className={styles.chips}>
        {TYPE_CHIPS.map(({ label, type }) => (
          <Link
            key={label}
            href={buildInboxHref(state, { type })}
            aria-current={state.type === type ? "page" : undefined}
            className={styles.chip}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

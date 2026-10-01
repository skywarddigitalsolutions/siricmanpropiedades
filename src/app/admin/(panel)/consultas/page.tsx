import { listLeads, type Lead } from "@/lib/api/leads";
import {
  buildInboxHref,
  parseInboxParams,
  toLeadFilters,
  type InboxStatus,
} from "@/lib/leads/inbox-params";
import { getSessionToken } from "@/lib/session/dal";
import { handleSessionError } from "@/lib/session/session-error";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import FormNotice from "@/components/admin/forms/FormNotice/FormNotice";
import Pagination from "@/components/admin/panel/Pagination/Pagination";
import PageHeader from "@/components/admin/panel/PageHeader/PageHeader";
import InboxFilters from "@/components/admin/leads/InboxFilters/InboxFilters";
import LeadList from "@/components/admin/leads/LeadList/LeadList";
import styles from "./page.module.css";

const PAGE_SIZE = 20;

const EMPTY_MESSAGES: Record<InboxStatus, string> = {
  new: "No hay consultas nuevas.",
  contacted: "No hay consultas contactadas.",
  closed: "No hay consultas cerradas.",
  all: "Todavía no llegó ninguna consulta.",
};

type LeadsInboxPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** `/admin/consultas` — leads inbox (feature 8). */
export default async function LeadsInboxPage({ searchParams }: LeadsInboxPageProps) {
  const query = await searchParams;
  const state = parseInboxParams(query);
  const token = await getSessionToken();

  let leads: Lead[] = [];
  let total = 0;
  let unavailable = false;
  try {
    ({ items: leads, total } = await listLeads(token, toLeadFilters(state, PAGE_SIZE)));
  } catch (error) {
    handleUnlessUnavailable(error);
    unavailable = true;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={styles.page}>
      <PageHeader
        title="Consultas"
        description="Mensajes del sitio: consultas por propiedades, tasaciones y contacto."
      />
      {query.eliminada === "1" && <FormNotice>Consulta eliminada.</FormNotice>}
      <InboxFilters state={state} />

      {unavailable ? (
        <FormAlert>No se pudieron cargar las consultas. Intentá de nuevo en unos minutos.</FormAlert>
      ) : leads.length === 0 ? (
        <p className={styles.empty}>{EMPTY_MESSAGES[state.status]}</p>
      ) : (
        <>
          <LeadList leads={leads} />
          <Pagination
            label="Paginación de consultas"
            page={state.page}
            totalPages={totalPages}
            totalLabel={`${total} ${total === 1 ? "consulta" : "consultas"}`}
            previousHref={state.page > 1 ? buildInboxHref(state, { page: state.page - 1 }) : undefined}
            nextHref={
              state.page < totalPages ? buildInboxHref(state, { page: state.page + 1 }) : undefined
            }
          />
        </>
      )}
    </div>
  );
}

/** 401 → login; network/5xx → "unavailable" message; anything else bubbles up. */
function handleUnlessUnavailable(error: unknown): void {
  const status = (error as { status?: number } | null)?.status;
  if (status === 0 || (status !== undefined && status >= 500)) return;
  handleSessionError(error);
}

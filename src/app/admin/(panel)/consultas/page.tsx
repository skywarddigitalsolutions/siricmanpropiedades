import Link from "next/link";
import { Inbox, SearchX } from "lucide-react";
import { listLeads, type Lead, type LeadCounts } from "@/lib/api/leads";
import {
  buildInboxHref,
  INBOX_PATH,
  parseInboxParams,
  STATUS_SLUGS,
  TYPE_SLUGS,
  toLeadFilters,
  type InboxStatus,
} from "@/lib/leads/inbox-params";
import { getSessionToken } from "@/lib/session/dal";
import { handleUnlessUnavailable } from "@/lib/session/session-error";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import FormNotice from "@/components/admin/forms/FormNotice/FormNotice";
import EmptyState from "@/components/admin/ui/EmptyState/EmptyState";
import { ButtonLink } from "@/components/admin/ui/Button/Button";
import Pagination from "@/components/admin/panel/Pagination/Pagination";
import PageHeader from "@/components/admin/panel/PageHeader/PageHeader";
import SearchForm from "@/components/admin/panel/SearchForm/SearchForm";
import InboxFilters from "@/components/admin/leads/InboxFilters/InboxFilters";
import LeadList from "@/components/admin/leads/LeadList/LeadList";
import { updateLeadAction } from "./[id]/actions";
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

/** `/admin/consultas` — leads inbox: search, status tabs with counts and quick actions. */
export default async function LeadsInboxPage({ searchParams }: LeadsInboxPageProps) {
  const query = await searchParams;
  const state = parseInboxParams(query);
  const token = await getSessionToken();

  let leads: Lead[] = [];
  let counts: LeadCounts | undefined;
  let total = 0;
  let unavailable = false;
  try {
    ({ items: leads, total, counts } = await listLeads(token, toLeadFilters(state, PAGE_SIZE)));
  } catch (error) {
    handleUnlessUnavailable(error);
    unavailable = true;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Searching keeps the other filters: they travel as hidden inputs of the GET form.
  const kept: Record<string, string> = {
    ...(state.status !== "new" ? { estado: STATUS_SLUGS[state.status] } : {}),
    ...(state.type ? { tipo: TYPE_SLUGS[state.type] } : {}),
    ...(state.propertyId ? { propiedad: state.propertyId } : {}),
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Consultas"
        description="Mensajes del sitio: consultas por propiedades, tasaciones y contacto."
      />
      {query.eliminada === "1" && <FormNotice>Consulta eliminada.</FormNotice>}
      <SearchForm
        action={INBOX_PATH}
        label="Buscar consultas"
        placeholder="Nombre, email, teléfono o mensaje"
        value={state.q ?? ""}
        clearHref={buildInboxHref(state, { q: undefined })}
        hidden={kept}
      />
      <InboxFilters state={state} counts={counts} />
      {state.propertyId && (
        <p className={styles.scope}>
          Solo consultas de una propiedad.{" "}
          <Link href={buildInboxHref(state, { propertyId: undefined })}>Ver todas</Link>
        </p>
      )}

      {unavailable ? (
        <FormAlert>No se pudieron cargar las consultas. Intentá de nuevo en unos minutos.</FormAlert>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={state.q ? SearchX : Inbox}
          title={state.q ? `No encontramos consultas para “${state.q}”.` : EMPTY_MESSAGES[state.status]}
          description={
            state.q ? "Probá con otro nombre, email o teléfono." : "Cuando llegue una, la vas a ver acá."
          }
        >
          {(state.q || state.status !== "all") && (
            <ButtonLink
              href={buildInboxHref(state, state.q ? { q: undefined } : { status: "all" })}
              variant="secondary"
            >
              {state.q ? "Limpiar búsqueda" : "Ver todas las consultas"}
            </ButtonLink>
          )}
        </EmptyState>
      ) : (
        <>
          <LeadList leads={leads} updateAction={updateLeadAction} />
          <Pagination
            label="Paginación de consultas"
            page={state.page}
            totalPages={totalPages}
            totalLabel={`${total} ${total === 1 ? "consulta" : "consultas"}`}
            hrefFor={(target) => buildInboxHref(state, { page: target })}
          />
        </>
      )}
    </div>
  );
}

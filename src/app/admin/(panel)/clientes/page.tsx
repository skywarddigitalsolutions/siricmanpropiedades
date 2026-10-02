import { Download, SearchX, UsersRound, X } from "lucide-react";
import { listClients, type Client } from "@/lib/api/clients";
import {
  buildClientsHref,
  buildExportHref,
  CLIENTS_PATH,
  parseClientsParams,
} from "@/lib/clients/clients-params";
import { getSessionToken } from "@/lib/session/dal";
import { handleUnlessUnavailable } from "@/lib/session/session-error";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import EmptyState from "@/components/admin/ui/EmptyState/EmptyState";
import { ButtonLink } from "@/components/admin/ui/Button/Button";
import PageHeader from "@/components/admin/panel/PageHeader/PageHeader";
import Pagination from "@/components/admin/panel/Pagination/Pagination";
import SearchForm from "@/components/admin/panel/SearchForm/SearchForm";
import ClientTable from "@/components/admin/clients/ClientTable/ClientTable";
import styles from "./page.module.css";

const PAGE_SIZE = 20;

type ClientsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** `/admin/clientes` — everyone who left an email, one row per person (feature 15). */
export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const state = parseClientsParams(await searchParams);
  const token = await getSessionToken();

  let clients: Client[] = [];
  let total = 0;
  let unavailable = false;
  try {
    ({ items: clients, total } = await listClients(token, {
      q: state.q,
      limit: PAGE_SIZE,
      offset: (state.page - 1) * PAGE_SIZE,
    }));
  } catch (error) {
    handleUnlessUnavailable(error);
    unavailable = true;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={styles.page}>
      <PageHeader
        title="Clientes"
        description="Personas que dejaron su email en el sitio, sin duplicados."
        actions={
          // A plain link: the CSV comes from a route handler, not a client navigation.
          <ButtonLink
            href={buildExportHref(state)}
            native
            variant="secondary"
            icon={<Download aria-hidden size={18} />}
          >
            Exportar CSV
          </ButtonLink>
        }
      />
      <SearchForm
        action={CLIENTS_PATH}
        label="Buscar clientes"
        placeholder="Nombre, email o teléfono"
        value={state.q}
        clearHref={CLIENTS_PATH}
      />

      {unavailable ? (
        <FormAlert>No se pudieron cargar los clientes. Intentá de nuevo en unos minutos.</FormAlert>
      ) : clients.length === 0 ? (
        state.q ? (
          <EmptyState
            icon={SearchX}
            title={`No encontramos clientes para “${state.q}”.`}
            description="Revisá la ortografía o probá con otro dato."
          >
            <ButtonLink
              href={CLIENTS_PATH}
              variant="secondary"
              icon={<X aria-hidden size={18} />}
            >
              Limpiar búsqueda
            </ButtonLink>
          </EmptyState>
        ) : (
          <EmptyState
            icon={UsersRound}
            title="Todavía no hay clientes."
            description="Aparecen cuando alguien deja su email en una consulta."
          />
        )
      ) : (
        <>
          <ClientTable clients={clients} />
          <Pagination
            label="Paginación de clientes"
            page={state.page}
            totalPages={totalPages}
            totalLabel={`${total} ${total === 1 ? "cliente" : "clientes"}`}
            hrefFor={(target) => buildClientsHref(state, { page: target })}
          />
        </>
      )}
    </div>
  );
}

import { Download } from "lucide-react";
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
          <a href={buildExportHref(state)} className={styles.export}>
            <Download aria-hidden size={18} />
            Exportar CSV
          </a>
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
        <p className={styles.empty}>
          {state.q
            ? `No encontramos clientes para “${state.q}”.`
            : "Todavía no hay clientes: aparecen cuando alguien deja su email en una consulta."}
        </p>
      ) : (
        <>
          <ClientTable clients={clients} />
          <Pagination
            label="Paginación de clientes"
            page={state.page}
            totalPages={totalPages}
            totalLabel={`${total} ${total === 1 ? "cliente" : "clientes"}`}
            previousHref={
              state.page > 1 ? buildClientsHref(state, { page: state.page - 1 }) : undefined
            }
            nextHref={
              state.page < totalPages ? buildClientsHref(state, { page: state.page + 1 }) : undefined
            }
          />
        </>
      )}
    </div>
  );
}

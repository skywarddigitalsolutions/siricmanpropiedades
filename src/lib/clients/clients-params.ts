/** Clients URL state: `/admin/clientes?q=…&pagina=…` (shareable, server-rendered). */
export type ClientsState = { q: string; page: number };

export const CLIENTS_PATH = "/admin/clientes";
export const CLIENTS_EXPORT_PATH = "/admin/clientes/export";

type RawParams = Record<string, string | string[] | undefined>;

const first = (raw: RawParams, key: string) => {
  const value = raw[key];
  return Array.isArray(value) ? value[0] : value;
};

export function parseClientsParams(raw: RawParams): ClientsState {
  const page = Number(first(raw, "pagina"));
  return {
    q: (first(raw, "q") ?? "").trim(),
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

/** Clients URL with `patch` applied; a new search goes back to page 1 by the caller. */
export function buildClientsHref(state: ClientsState, patch: Partial<ClientsState> = {}): string {
  const next = { ...state, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.page > 1) params.set("pagina", String(next.page));
  const query = params.toString();
  return query ? `${CLIENTS_PATH}?${query}` : CLIENTS_PATH;
}

/** CSV download link: keeps the search, never the page (the export is the whole result). */
export function buildExportHref(state: ClientsState): string {
  return state.q
    ? `${CLIENTS_EXPORT_PATH}?${new URLSearchParams({ q: state.q }).toString()}`
    : CLIENTS_EXPORT_PATH;
}

const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** "30/09/2026" in Buenos Aires time (built from parts: locale data varies). */
export function formatClientDate(iso: string): string {
  const parts = Object.fromEntries(
    DATE_FORMAT.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return `${parts.day.padStart(2, "0")}/${parts.month.padStart(2, "0")}/${parts.year}`;
}

const RELATIVE_FORMAT = new Intl.RelativeTimeFormat("es", { numeric: "always" });

const UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 365 * 24 * 3600 },
  { unit: "month", seconds: 30 * 24 * 3600 },
  { unit: "day", seconds: 24 * 3600 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
];

/** "hace 3 días", "hace 2 meses"; under a minute → "hace un momento". */
export function formatRelativeDate(iso: string, now: Date = new Date()): string {
  const elapsed = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  for (const { unit, seconds } of UNITS) {
    if (elapsed >= seconds) return RELATIVE_FORMAT.format(-Math.floor(elapsed / seconds), unit);
  }
  return "hace un momento";
}

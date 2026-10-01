export type AdminNavItem = {
  label: string;
  href: string;
};

/**
 * Panel navigation, as a data array so later features (e.g. "Consultas" in
 * feature 8) can extend it without touching `AdminNav` or `AdminShell`.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Propiedades", href: "/admin/propiedades" },
  { label: "Consultas", href: "/admin/consultas" },
];

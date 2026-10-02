import {
  Building2,
  Inbox,
  LayoutDashboard,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Only shown to (and allowed for) the `admin` role. */
  adminOnly?: boolean;
  /** Active only on this exact path (the home, whose href prefixes every other item). */
  exact?: boolean;
};

/**
 * Panel navigation, as a data array so later features can extend it without
 * touching `AdminNav` or `AdminShell`.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Inicio", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Propiedades", href: "/admin/propiedades", icon: Building2 },
  { label: "Consultas", href: "/admin/consultas", icon: Inbox },
  { label: "Clientes", href: "/admin/clientes", icon: Users },
  { label: "Usuarios", href: "/admin/usuarios", icon: UserCog, adminOnly: true },
];

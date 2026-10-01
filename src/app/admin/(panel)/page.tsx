import { redirect } from "next/navigation";

/**
 * `/admin` landing route (Requirement: Authenticated Admin Landing Page).
 * The `(panel)` layout already establishes and role-gates the session via
 * `getCurrentUser()`, so this page only redirects to the actual landing
 * screen, the property list (feature 6 T2).
 */
export default async function AdminPanelPage() {
  redirect("/admin/propiedades");
}

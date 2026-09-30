import { getCurrentUser } from "@/lib/session/dal";
import styles from "./page.module.css";

/**
 * `/admin` landing page (Requirement: Authenticated Admin Landing Page).
 * Calls `getCurrentUser()` again — deduped against the layout's call within
 * the same request via `React.cache` (ADR-7) — and shows the greeting.
 */
export default async function AdminPanelPage() {
  const user = await getCurrentUser();

  return (
    <section className={styles.greeting}>
      <h1>Hola, {user.userName}</h1>
    </section>
  );
}

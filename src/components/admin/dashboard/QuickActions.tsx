import { Inbox, Plus, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/admin/ui/Button/Button";
import styles from "./QuickActions.module.css";

/** Shortcuts to the three things done most often. */
export default function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-title" className={styles.section}>
      <h2 id="quick-actions-title" className={styles.title}>
        Accesos rápidos
      </h2>
      <div className={styles.actions}>
        <ButtonLink href="/admin/propiedades/nueva" icon={<Plus aria-hidden size={18} />}>
          Nueva propiedad
        </ButtonLink>
        <ButtonLink
          href="/admin/consultas"
          variant="secondary"
          icon={<Inbox aria-hidden size={18} />}
        >
          Ver consultas
        </ButtonLink>
        <ButtonLink
          href="/admin/clientes"
          variant="secondary"
          icon={<UsersRound aria-hidden size={18} />}
        >
          Ver clientes
        </ButtonLink>
      </div>
    </section>
  );
}

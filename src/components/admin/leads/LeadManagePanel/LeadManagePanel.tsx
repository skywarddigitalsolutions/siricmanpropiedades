"use client";

import { useActionState } from "react";
import { CheckCheck } from "lucide-react";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/leads/labels";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import FormNotice from "@/components/admin/forms/FormNotice/FormNotice";
import styles from "./LeadManagePanel.module.css";

type LeadManagePanelProps = {
  status: LeadStatus;
  notes: string | null;
  /** Admins only (the API refuses managers). */
  canDelete: boolean;
  updateAction: (prev: ActionFeedback, formData: FormData) => Promise<ActionFeedback>;
  deleteAction: () => Promise<ActionFeedback>;
};

function Feedback({ state }: { state: ActionFeedback }) {
  if (state.error) return <FormAlert>{state.error}</FormAlert>;
  if (state.message) return <FormNotice>{state.message}</FormNotice>;
  return null;
}

/**
 * Follow-up block of a lead: one-tap "contacted", status + internal notes,
 * and the admin-only delete behind a confirmation step.
 */
export default function LeadManagePanel({
  status,
  notes,
  canDelete,
  updateAction,
  deleteAction,
}: LeadManagePanelProps) {
  const [quickState, submitQuick, quickPending] = useActionState(updateAction, {});
  const [saveState, submitSave, savePending] = useActionState(updateAction, {});
  const [deleteState, submitDelete, deletePending] = useActionState(deleteAction, {});

  return (
    <div className={styles.panel}>
      {status === "new" && (
        <form action={submitQuick} className={styles.quick}>
          <input type="hidden" name="status" value="contacted" />
          <button type="submit" className={styles.primary} disabled={quickPending}>
            <CheckCheck aria-hidden size={18} />
            Marcar como contactada
          </button>
        </form>
      )}
      {/* Outside the form: a successful one-tap change makes the lead
          "contacted", which removes the form, but the confirmation stays. */}
      <Feedback state={quickState} />

      <form action={submitSave} className={styles.card}>
        <h2 className={styles.title}>Seguimiento</h2>
        <div className={styles.field}>
          <label htmlFor="lead-status" className={styles.label}>
            Estado
          </label>
          {/* Keyed by the saved status so the select follows server updates. */}
          <select
            key={status}
            id="lead-status"
            name="status"
            defaultValue={status}
            className={styles.input}
          >
            {LEAD_STATUSES.map((value) => (
              <option key={value} value={value}>
                {LEAD_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="lead-notes" className={styles.label}>
            Notas internas
          </label>
          <textarea
            id="lead-notes"
            name="notes"
            rows={4}
            maxLength={2000}
            defaultValue={notes ?? ""}
            placeholder="Ej.: llamé el martes, quiere visitar el sábado."
            className={styles.input}
          />
          <p className={styles.hint}>Solo las ve el equipo.</p>
        </div>
        <button type="submit" className={styles.secondary} disabled={savePending}>
          Guardar
        </button>
        <Feedback state={saveState} />
      </form>

      {canDelete && (
        <form action={submitDelete} className={`${styles.card} ${styles.danger}`}>
          <details>
            <summary className={styles.summary}>Eliminar consulta</summary>
            <p className={styles.hint}>
              Se borra definitivamente. Usalo para spam o mensajes de prueba.
            </p>
            <button type="submit" className={styles.destructive} disabled={deletePending}>
              Sí, eliminar definitivamente
            </button>
          </details>
          <Feedback state={deleteState} />
        </form>
      )}
    </div>
  );
}

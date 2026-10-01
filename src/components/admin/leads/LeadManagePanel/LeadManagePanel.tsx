"use client";

import { useActionState, useOptimistic, useState, useTransition } from "react";
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
 * Follow-up block of a lead: the status as a 3-option segmented control that
 * saves on change (optimistic, rolled back on error), internal notes, and the
 * admin-only delete behind a confirmation step.
 */
export default function LeadManagePanel({
  status,
  notes,
  canDelete,
  updateAction,
  deleteAction,
}: LeadManagePanelProps) {
  // Optimistic status: shows the pick at once and falls back to the saved
  // `status` prop when the action fails (or once the refreshed page arrives).
  const [shownStatus, setShownStatus] = useOptimistic(status);
  const [statusFeedback, setStatusFeedback] = useState<ActionFeedback>({});
  const [, startTransition] = useTransition();
  const [notesState, submitNotes, notesPending] = useActionState(updateAction, {});
  const [deleteState, submitDelete, deletePending] = useActionState(deleteAction, {});

  function changeStatus(next: LeadStatus) {
    const formData = new FormData();
    formData.set("status", next);
    startTransition(async () => {
      setShownStatus(next);
      const result = await updateAction({}, formData);
      setStatusFeedback(result.error ? { error: result.error } : { message: "Estado actualizado." });
    });
  }

  return (
    <div className={styles.panel}>
      <section aria-labelledby="lead-status-label" className={styles.card}>
        <h2 id="lead-status-label" className={styles.title}>
          Estado
        </h2>
        <div role="radiogroup" aria-labelledby="lead-status-label" className={styles.segmented}>
          {LEAD_STATUSES.map((value) => (
            <label key={value} className={styles.segment}>
              <input
                type="radio"
                name="status"
                value={value}
                checked={shownStatus === value}
                onChange={() => changeStatus(value)}
                className={styles.radio}
              />
              <span className={styles.segmentLabel}>{LEAD_STATUS_LABELS[value]}</span>
            </label>
          ))}
        </div>
        <Feedback state={statusFeedback} />
      </section>

      <form action={submitNotes} className={styles.card}>
        <input type="hidden" name="status" value={shownStatus} />
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
        <button type="submit" className={styles.secondary} disabled={notesPending}>
          Guardar notas
        </button>
        <Feedback state={notesState} />
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

"use client";

import { useActionState } from "react";
import type { DealStatus, Operation, PublicationStatus } from "@/lib/properties/enums";
import {
  dealStatusOptions,
  publicationTransitions,
} from "@/lib/properties/lifecycle";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import FormNotice from "@/components/admin/forms/FormNotice/FormNotice";
import SelectField from "@/components/admin/forms/SelectField/SelectField";
import ReadinessChecklist from "@/components/admin/properties/ReadinessChecklist/ReadinessChecklist";
import type { Readiness } from "@/lib/properties/readiness";
import styles from "./PropertyStatusPanel.module.css";

type FeedbackAction = (
  prev: ActionFeedback,
  formData: FormData,
) => Promise<ActionFeedback>;

type PropertyStatusPanelProps = {
  propertyId: string;
  /** Photos, description and price: Publicar stays disabled until it is ready. */
  readiness: Readiness;
  publicationStatus: PublicationStatus;
  dealStatus: DealStatus;
  operation: Operation;
  /** Admin and never published: the back allows a hard delete. */
  canDelete: boolean;
  /** Admin and already published: explain why there is no delete. */
  showArchiveHint: boolean;
  publicationAction: FeedbackAction;
  dealStatusAction: FeedbackAction;
  deleteAction: FeedbackAction;
};

const STATUS_HINTS: Record<PublicationStatus, string> = {
  draft: "No se ve en el sitio. Publicala cuando los datos y las fotos estén listos.",
  published: "Visible en el sitio.",
  archived: "Oculta del sitio y fuera del listado habitual.",
};

function Feedback({ state }: { state: ActionFeedback }) {
  if (state.error) return <FormAlert>{state.error}</FormAlert>;
  if (state.message) return <FormNotice>{state.message}</FormNotice>;
  return null;
}

/**
 * Status and actions block of the property editor (feature 6 T5):
 * publication transitions, deal status (restricted by operation) and the
 * admin-only delete behind an explicit confirmation step.
 */
export default function PropertyStatusPanel({
  propertyId,
  readiness,
  publicationStatus,
  dealStatus,
  operation,
  canDelete,
  showArchiveHint,
  publicationAction,
  dealStatusAction,
  deleteAction,
}: PropertyStatusPanelProps) {
  const [publicationState, submitPublication, publicationPending] =
    useActionState(publicationAction, {});
  const [dealState, submitDeal, dealPending] = useActionState(dealStatusAction, {});
  const [deleteState, submitDelete, deletePending] = useActionState(deleteAction, {});
  // Only publishing needs the checklist; an already published property is just shown as live.
  const showChecklist = publicationStatus !== "published";
  const publishBlocked = showChecklist && !readiness.ready;

  return (
    <div className={styles.panel}>
      <form action={submitPublication} className={styles.card}>
        <fieldset className={styles.fieldset} disabled={publicationPending}>
          <legend className={styles.legend}>Publicación</legend>
          <p className={styles.hint}>{STATUS_HINTS[publicationStatus]}</p>
          {showChecklist && (
            <ReadinessChecklist readiness={readiness} propertyId={propertyId} />
          )}
          {publishBlocked && (
            <p id="publish-blocked" className="sr-only">
              Falta: {readiness.missing.join("; ")}.
            </p>
          )}
          <div className={styles.buttons}>
            {publicationTransitions(publicationStatus).map(({ transition, label }) => {
              const blocked = transition === "publish" && publishBlocked;
              return (
                <button
                  key={transition}
                  type="submit"
                  name="transition"
                  value={transition}
                  className={transition === "publish" ? styles.primary : styles.secondary}
                  disabled={blocked}
                  aria-describedby={blocked ? "publish-blocked" : undefined}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <Feedback state={publicationState} />
        </fieldset>
      </form>

      <form action={submitDeal} className={styles.card}>
        <fieldset className={styles.fieldset} disabled={dealPending}>
          <legend className={styles.legend}>Operación comercial</legend>
          {/* Keyed by the saved status so the select resets after it changes. */}
          <SelectField
            key={dealStatus}
            id="dealStatus"
            name="dealStatus"
            label="Estado comercial"
            options={dealStatusOptions(operation, dealStatus)}
            defaultValue={dealStatus}
          />
          <div className={styles.buttons}>
            <button type="submit" className={styles.secondary}>
              Actualizar estado
            </button>
          </div>
          <Feedback state={dealState} />
        </fieldset>
      </form>

      {canDelete && (
        <form action={submitDelete} className={`${styles.card} ${styles.danger}`}>
          <details className={styles.details}>
            <summary className={styles.summary}>Eliminar propiedad</summary>
            <p className={styles.hint}>
              Se borra definitivamente junto con sus fotos. Solo es posible porque
              nunca se publicó.
            </p>
            <button
              type="submit"
              className={styles.destructive}
              disabled={deletePending}
            >
              Sí, eliminar definitivamente
            </button>
          </details>
          <Feedback state={deleteState} />
        </form>
      )}

      {showArchiveHint && (
        <p className={styles.footnote}>
          Esta propiedad ya fue publicada, así que no se puede eliminar: archivala
          para ocultarla del sitio.
        </p>
      )}
    </div>
  );
}

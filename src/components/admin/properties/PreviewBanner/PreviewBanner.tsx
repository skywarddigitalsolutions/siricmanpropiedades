"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import type { PublicationStatus } from "@/lib/properties/enums";
import type { Readiness } from "@/lib/properties/readiness";
import { stepHref } from "@/lib/properties/steps";
import styles from "./PreviewBanner.module.css";

type PreviewBannerProps = {
  propertyId: string;
  publicationStatus: PublicationStatus;
  readiness: Readiness;
  /** `changePublicationAction` already bound to the property id. */
  publicationAction: (
    prev: ActionFeedback,
    formData: FormData,
  ) => Promise<ActionFeedback>;
  /** Public URL of the listing, offered once it is published. */
  siteHref: string;
};

/**
 * Sticky bar of the preview page: says this is a preview, goes back to the
 * editor and publishes — only when the readiness checklist is complete.
 */
export default function PreviewBanner({
  propertyId,
  publicationStatus,
  readiness,
  publicationAction,
  siteHref,
}: PreviewBannerProps) {
  const [state, submit, pending] = useActionState(publicationAction, {});
  const published = publicationStatus === "published" || Boolean(state.message);
  const blocked = !published && !readiness.ready;

  return (
    <div className={styles.banner}>
      <div className={styles.info}>
        <p className={styles.title}>Vista previa — así la verán tus clientes</p>
        {published ? (
          <p className={styles.sub}>Ya está publicada</p>
        ) : blocked ? (
          <p id="preview-blocked" className={styles.sub}>
            Todavía no se puede publicar. Falta: {readiness.missing.join("; ")}.
          </p>
        ) : (
          <p className={styles.sub}>Todavía es un borrador: nadie más la ve.</p>
        )}
        {state.error && (
          <p role="alert" className={styles.error}>
            {state.error}
          </p>
        )}
        {state.message && (
          <p role="status" className={styles.sub}>
            {state.message}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        <Link href={stepHref(propertyId, "datos")} className={styles.secondary}>
          Volver a editar
        </Link>
        {published ? (
          <a
            href={siteHref}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.primary}
          >
            Ver en el sitio
          </a>
        ) : (
          <form action={submit}>
            <button
              type="submit"
              name="transition"
              value="publish"
              className={styles.primary}
              disabled={pending || blocked}
              aria-describedby={blocked ? "preview-blocked" : undefined}
            >
              Publicar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

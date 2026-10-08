"use client";

import { useActionState } from "react";
import type { PublicationStatus } from "@/lib/properties/enums";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import { Archive, Send } from "lucide-react";
import IconButton from "@/components/admin/ui/IconButton/IconButton";
import styles from "./PropertyQuickActions.module.css";

type PropertyQuickActionsProps = {
  id: string;
  title: string;
  publicationStatus: PublicationStatus;
  /** `changePublicationAction` (id first, then the `useActionState` pair). */
  action: (
    id: string,
    prev: ActionFeedback,
    formData: FormData,
  ) => Promise<ActionFeedback>;
  /** When set, Publicar is disabled and this explains why. */
  publishBlockedReason?: string;
};

/**
 * One-tap Publicar / Retirar (icon buttons) for a list row, reusing the editor's lifecycle
 * server action. A sibling of the row's title link, never nested in it.
 */
export default function PropertyQuickActions({
  id,
  title,
  publicationStatus,
  action,
  publishBlockedReason,
}: PropertyQuickActionsProps) {
  const [state, submit, pending] = useActionState(action.bind(null, id), {});

  if (publicationStatus === "archived") return null;
  const isPublished = publicationStatus === "published";
  const blocked = !isPublished && Boolean(publishBlockedReason);

  return (
    <form action={submit} className={styles.form}>
      <IconButton
        type="submit"
        name="transition"
        value={isPublished ? "unpublish" : "publish"}
        icon={isPublished ? Archive : Send}
        tone={isPublished ? "default" : "primary"}
        disabled={pending || blocked}
        tooltip={blocked ? publishBlockedReason : isPublished ? "Retirar" : "Publicar"}
        label={`${isPublished ? "Retirar" : "Publicar"} ${title}`}
      />
      {blocked && <p className={styles.note}>{publishBlockedReason}</p>}
      {state.error && (
        <p role="alert" className={styles.error}>
          {state.error}
        </p>
      )}
    </form>
  );
}

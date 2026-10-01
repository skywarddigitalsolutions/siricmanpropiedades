import type { DealStatus, Operation, PublicationStatus } from "./enums";
import { allowedDealStatuses, DEAL_STATUS_LABELS } from "./labels";

export type PublicationTransition = "publish" | "archive" | "unpublish";

const TRANSITION_LABELS: Record<PublicationTransition, string> = {
  publish: "Publicar",
  unpublish: "Pasar a borrador",
  archive: "Archivar",
};

/** Transitions the back accepts from each status (mirrors `property-lifecycle.ts` in the back). */
const TRANSITIONS_FROM: Record<PublicationStatus, PublicationTransition[]> = {
  draft: ["publish", "archive"],
  published: ["unpublish", "archive"],
  archived: ["publish", "unpublish"],
};

export function publicationTransitions(
  status: PublicationStatus,
): { transition: PublicationTransition; label: string }[] {
  return TRANSITIONS_FROM[status].map((transition) => ({
    transition,
    label: TRANSITION_LABELS[transition],
  }));
}

/**
 * Deal statuses offered for an operation (sold only for sales, rented only
 * for rents). The current status is kept even when it breaks the rule (e.g.
 * the operation was edited afterwards) so the select never misreports it.
 */
export function dealStatusOptions(
  operation: Operation,
  current: DealStatus,
): { value: DealStatus; label: string }[] {
  const statuses = allowedDealStatuses(operation);
  if (!statuses.includes(current)) statuses.push(current);
  return statuses.map((value) => ({ value, label: DEAL_STATUS_LABELS[value] }));
}

/** The back hard-deletes only never-published properties, and only for admins. */
export function canDeleteProperty(
  roles: readonly string[],
  property: { firstPublishedAt: string | null },
): boolean {
  return roles.includes("admin") && property.firstPublishedAt === null;
}

/** `useActionState` result of a lifecycle action: a confirmation or an error to show. */
export type ActionFeedback = { message?: string; error?: string };

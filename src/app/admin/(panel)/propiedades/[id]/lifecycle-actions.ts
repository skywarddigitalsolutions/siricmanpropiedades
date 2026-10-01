"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import {
  archiveProperty,
  deleteProperty,
  getProperty,
  publishProperty,
  unpublishProperty,
  updateDealStatus,
} from "@/lib/api/properties";
import { DEAL_STATUSES, type DealStatus } from "@/lib/properties/enums";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import type { PublicationTransition } from "@/lib/properties/lifecycle";
import { computeReadiness } from "@/lib/properties/readiness";
import { getSessionToken } from "@/lib/session/dal";
import { handleSessionError } from "@/lib/session/session-error";

const TRANSITION_CALLS: Record<
  PublicationTransition,
  { run: typeof publishProperty; message: string }
> = {
  publish: { run: publishProperty, message: "Propiedad publicada." },
  archive: { run: archiveProperty, message: "Propiedad archivada." },
  unpublish: { run: unpublishProperty, message: "La propiedad volvió a borrador." },
};

const UNAVAILABLE = "No se pudo completar la acción. Probá de nuevo en unos minutos.";

/**
 * Shared error handling: 401 → login, 404 → not-found page, known statuses →
 * the given message, network/5xx → a retry hint. Anything else bubbles up.
 */
function toFeedback(
  error: unknown,
  messages: Partial<Record<number, string>>,
): ActionFeedback {
  if (!(error instanceof ApiError)) throw error;
  if (error.status === 401) handleSessionError(error);
  if (error.status === 404) notFound();
  const message = messages[error.status];
  if (message) return { error: message };
  if (error.status === 0 || error.status === 429 || error.status >= 500) {
    return { error: UNAVAILABLE };
  }
  throw error;
}

function revalidateProperty(id: string) {
  revalidatePath("/admin/propiedades");
  revalidatePath(`/admin/propiedades/${id}`);
}

/** Publish / archive / unpublish; the transition comes from the pressed button. */
export async function changePublicationAction(
  id: string,
  _prevState: ActionFeedback,
  formData: FormData,
): Promise<ActionFeedback> {
  const transition = formData.get("transition");
  if (typeof transition !== "string" || !(transition in TRANSITION_CALLS)) {
    return { error: "Acción no válida." };
  }
  const { run, message } = TRANSITION_CALLS[transition as PublicationTransition];

  const token = await getSessionToken();
  try {
    // The back does not require photos or a description, so the panel does:
    // publishing is blocked until the readiness checklist is complete.
    if (transition === "publish") {
      const property = await getProperty(token, id);
      const { ready, missing } = computeReadiness({
        imageCount: property.images.length,
        description: property.description,
        price: property.price,
      });
      if (!ready) {
        return { error: `Todavía no se puede publicar. Falta: ${missing.join("; ")}.` };
      }
    }
    await run(token, id);
  } catch (error) {
    return toFeedback(error, {
      400: "El estado cambió mientras tanto; recargá la página e intentá de nuevo.",
    });
  }

  revalidateProperty(id);
  return { message };
}

export async function changeDealStatusAction(
  id: string,
  _prevState: ActionFeedback,
  formData: FormData,
): Promise<ActionFeedback> {
  const dealStatus = formData.get("dealStatus");
  if (!(DEAL_STATUSES as readonly unknown[]).includes(dealStatus)) {
    return { error: "Elegí un estado comercial válido." };
  }

  const token = await getSessionToken();
  try {
    await updateDealStatus(token, id, dealStatus as DealStatus);
  } catch (error) {
    if (error instanceof ApiError && error.message.startsWith("Deal status")) {
      return { error: "Ese estado comercial no corresponde a la operación de la propiedad." };
    }
    return toFeedback(error, { 400: "La propiedad ya tiene ese estado comercial." });
  }

  revalidateProperty(id);
  return { message: "Estado comercial actualizado." };
}

/**
 * Hard delete (admins only, never-published properties only). Used with
 * `useActionState`, which also passes the previous state and form data; this
 * action needs neither.
 */
export async function deletePropertyAction(id: string): Promise<ActionFeedback> {
  const token = await getSessionToken();
  try {
    await deleteProperty(token, id);
  } catch (error) {
    return toFeedback(error, {
      400: "La propiedad ya fue publicada alguna vez; archivala en lugar de eliminarla.",
      403: "Solo un administrador puede eliminar propiedades.",
    });
  }

  revalidatePath("/admin/propiedades");
  redirect("/admin/propiedades?eliminada=1");
}

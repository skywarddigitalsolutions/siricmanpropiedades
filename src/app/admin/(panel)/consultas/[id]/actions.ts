"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { deleteLead, updateLead } from "@/lib/api/leads";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads/labels";
import { getSessionToken } from "@/lib/session/dal";
import { handleSessionError } from "@/lib/session/session-error";

const RETRY = "No se pudo guardar. Probá de nuevo en unos minutos.";

/** The nav badge (new-leads count) lives in the panel layout. */
function refreshPanel(id?: string) {
  revalidatePath("/admin", "layout");
  if (id) revalidatePath(`/admin/consultas/${id}`);
}

function toFeedback(error: unknown, messages: Partial<Record<number, string>>): ActionFeedback {
  if (!(error instanceof ApiError)) throw error;
  if (error.status === 401) handleSessionError(error);
  if (error.status === 404) notFound();
  const message = messages[error.status];
  if (message) return { error: message };
  if (error.status === 0 || error.status === 429 || error.status >= 500) return { error: RETRY };
  throw error;
}

/**
 * Saves a lead's status and, when the form has the field, its notes. The
 * lead id is bound by the page; the one-tap "Marcar como contactada" form
 * sends only `status`.
 */
export async function updateLeadAction(
  id: string,
  _prevState: ActionFeedback,
  formData: FormData,
): Promise<ActionFeedback> {
  const status = formData.get("status");
  if (!(LEAD_STATUSES as readonly unknown[]).includes(status)) {
    return { error: "Elegí un estado válido." };
  }
  const changes: { status: LeadStatus; notes?: string } = { status: status as LeadStatus };
  const notes = formData.get("notes");
  if (typeof notes === "string") {
    if (notes.trim().length > 2000) return { error: "Las notas pueden tener hasta 2000 caracteres." };
    changes.notes = notes.trim();
  }

  const token = await getSessionToken();
  try {
    await updateLead(token, id, changes);
  } catch (error) {
    if (error instanceof ApiError && error.message === "Nothing to update") {
      return { message: "No había cambios para guardar." };
    }
    return toFeedback(error, {});
  }

  refreshPanel(id);
  return { message: "Cambios guardados." };
}

/** Admin-only hard delete (spam cleanup). */
export async function deleteLeadAction(id: string): Promise<ActionFeedback> {
  const token = await getSessionToken();
  try {
    await deleteLead(token, id);
  } catch (error) {
    return toFeedback(error, { 403: "Solo un administrador puede eliminar consultas." });
  }

  refreshPanel();
  redirect("/admin/consultas?eliminada=1");
}

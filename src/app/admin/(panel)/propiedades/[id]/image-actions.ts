"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api/client";
import {
  deletePropertyImage,
  reorderPropertyImages,
  uploadPropertyImage,
} from "@/lib/api/properties";
import { MAX_IMAGES_PER_PROPERTY, validateImageFile } from "@/lib/properties/images";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import { getSessionToken } from "@/lib/session/dal";
import { handleSessionError } from "@/lib/session/session-error";

/**
 * Photo actions of the property editor (feature 6 T6). They are called
 * directly from the images manager (one upload per call, so each request
 * stays under the 15 MB limit) and return `{}` on success or `{ error }`.
 */

const RETRY = "No se pudo completar la acción. Probá de nuevo en unos minutos.";

function toImageError(
  error: unknown,
  messages: Partial<Record<number, string>>,
): ActionFeedback {
  if (!(error instanceof ApiError)) throw error;
  if (error.status === 401) handleSessionError(error);
  const message = messages[error.status];
  if (message) return { error: message };
  if (error.status === 429) {
    return { error: "Demasiadas acciones seguidas; esperá un minuto y reintentá." };
  }
  if (error.status === 0 || error.status >= 500) return { error: RETRY };
  throw error;
}

function revalidateEditor(id: string) {
  revalidatePath(`/admin/propiedades/${id}`);
}

export async function uploadImageAction(
  id: string,
  formData: FormData,
): Promise<ActionFeedback> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Elegí una foto para subir." };
  const invalid = validateImageFile(file);
  if (invalid) return { error: invalid };

  const token = await getSessionToken();
  try {
    await uploadPropertyImage(token, id, file);
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 400 &&
      /maximum/i.test(error.message)
    ) {
      return { error: `La propiedad ya tiene el máximo de ${MAX_IMAGES_PER_PROPERTY} fotos.` };
    }
    return toImageError(error, {
      400: "El archivo no es una imagen válida (JPG, PNG o WebP).",
      404: "La propiedad ya no existe.",
      413: "La foto supera los 15 MB.",
    });
  }

  revalidateEditor(id);
  return {};
}

export async function reorderImagesAction(
  id: string,
  imageIds: string[],
): Promise<ActionFeedback> {
  const token = await getSessionToken();
  try {
    await reorderPropertyImages(token, id, imageIds);
  } catch (error) {
    return toImageError(error, {
      400: "Las fotos cambiaron mientras tanto; recargá la página e intentá de nuevo.",
      404: "La propiedad ya no existe.",
    });
  }

  revalidateEditor(id);
  return {};
}

export async function deleteImageAction(
  id: string,
  imageId: string,
): Promise<ActionFeedback> {
  const token = await getSessionToken();
  try {
    await deletePropertyImage(token, id, imageId);
  } catch (error) {
    // Already gone (e.g. deleted from another tab): the goal is reached.
    if (!(error instanceof ApiError && error.status === 404)) {
      return toImageError(error, {});
    }
  }

  revalidateEditor(id);
  return {};
}

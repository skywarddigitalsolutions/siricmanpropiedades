"use server";

import { ApiError } from "@/lib/api/client";
import { submitLead } from "@/lib/api/leads";
import {
  appraisalValues,
  mapAppraisalApiErrors,
  parseAppraisalForm,
  type AppraisalFieldErrors,
  type AppraisalState,
} from "@/lib/leads/appraisal-form";

const RETRY =
  "No pudimos enviar la solicitud. Probá de nuevo en unos minutos o escribinos por WhatsApp.";

/** Sends the Tasaciones page form as an `appraisal` lead. */
export async function sendAppraisalAction(
  _prevState: AppraisalState,
  formData: FormData,
): Promise<AppraisalState> {
  const parsed = parseAppraisalForm(formData);
  if ("fieldErrors" in parsed) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values: appraisalValues(formData) };
  }

  try {
    await submitLead({ type: "appraisal", ...parsed.input });
  } catch (error) {
    return { status: "error", fieldErrors: toFieldErrors(error), values: appraisalValues(formData) };
  }
  return { status: "sent" };
}

function toFieldErrors(error: unknown): AppraisalFieldErrors {
  if (!(error instanceof ApiError)) return { general: RETRY };
  if (error.status === 429) {
    return { general: "Recibimos varios mensajes seguidos desde tu conexión. Probá de nuevo en un minuto." };
  }
  if (error.status === 400) return mapAppraisalApiErrors(error.details);
  return { general: RETRY };
}

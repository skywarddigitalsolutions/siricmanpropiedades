"use server";

import { ApiError } from "@/lib/api/client";
import { submitLead } from "@/lib/api/leads";
import {
  rentalValues,
  mapRentalApiErrors,
  parseRentalForm,
  type RentalFieldErrors,
  type RentalState,
} from "@/lib/leads/rental-management-form";

const RETRY = "No pudimos enviar la consulta. Probá de nuevo en unos minutos o escribinos por WhatsApp.";

/** Sends the rental management form as a `contact` lead with topic `rental_management`. */
export async function sendRentalAction(
  _prevState: RentalState,
  formData: FormData,
): Promise<RentalState> {
  const parsed = parseRentalForm(formData);
  if ("fieldErrors" in parsed) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values: rentalValues(formData) };
  }

  try {
    await submitLead(parsed.input);
  } catch (error) {
    return { status: "error", fieldErrors: toFieldErrors(error), values: rentalValues(formData) };
  }
  return { status: "sent" };
}

function toFieldErrors(error: unknown): RentalFieldErrors {
  if (!(error instanceof ApiError)) return { general: RETRY };
  if (error.status === 429) {
    return { general: "Recibimos varios mensajes seguidos desde tu conexión. Probá de nuevo en un minuto." };
  }
  if (error.status === 400) return mapRentalApiErrors(error.details);
  return { general: RETRY };
}

"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { updateProperty } from "@/lib/api/properties";
import { toPropertyFormErrorState } from "@/lib/properties/form-action-errors";
import {
  extractFormValues,
  parsePropertyForm,
  type PropertyFormState,
} from "@/lib/properties/property-form";
import {
  STEP_FIELDS,
  type FormStep,
  type StepId,
} from "@/lib/properties/steps";
import { getSessionToken } from "@/lib/session/dal";

const STEP_AFTER_SAVE: Record<FormStep, StepId> = {
  datos: "datos",
  extras: "descripcion",
};

/**
 * Saves one step of the edit form as a partial PATCH. The page binds the
 * property id and the step (`updatePropertyAction.bind(null, id, "datos")`),
 * so each step only validates and sends its own fields. Emptied optional
 * fields are sent as `null` so the back clears them (see `property-form.ts`).
 */
export async function updatePropertyAction(
  id: string,
  step: FormStep,
  _prevState: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const parsed = parsePropertyForm(formData, {
    mode: "edit",
    only: STEP_FIELDS[step],
  });
  if ("fieldErrors" in parsed) {
    return { fieldErrors: parsed.fieldErrors, values: extractFormValues(formData) };
  }

  const token = await getSessionToken();
  try {
    await updateProperty(token, id, parsed.input);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return toPropertyFormErrorState(error, formData);
  }

  revalidatePath("/admin/propiedades");
  revalidatePath(`/admin/propiedades/${id}`);
  redirect(`/admin/propiedades/${id}?paso=${STEP_AFTER_SAVE[step]}&guardada=1`);
}

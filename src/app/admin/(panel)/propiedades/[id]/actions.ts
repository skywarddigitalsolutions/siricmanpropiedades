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
import { getSessionToken } from "@/lib/session/dal";

/**
 * Saves the edit form. The property id is bound by the page
 * (`updatePropertyAction.bind(null, id)`). Emptied optional fields are sent
 * as `null` so the back clears them (see `property-form.ts`).
 */
export async function updatePropertyAction(
  id: string,
  _prevState: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const parsed = parsePropertyForm(formData, { mode: "edit" });
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
  redirect(`/admin/propiedades/${id}?guardada=1`);
}

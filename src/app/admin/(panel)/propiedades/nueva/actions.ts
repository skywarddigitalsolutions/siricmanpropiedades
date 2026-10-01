"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProperty } from "@/lib/api/properties";
import { toPropertyFormErrorState } from "@/lib/properties/form-action-errors";
import {
  extractFormValues,
  parsePropertyForm,
  type PropertyFormState,
} from "@/lib/properties/property-form";
import { STEP_FIELDS } from "@/lib/properties/steps";
import { getSessionToken } from "@/lib/session/dal";

/**
 * Creates a draft property from step 1 (the 13 required fields) and sends the
 * user to the photos step. Description, services and tags are added later.
 * `redirect()` stays outside the try/catch (it throws).
 */
export async function createPropertyAction(
  _prevState: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const parsed = parsePropertyForm(formData, {
    mode: "create",
    only: STEP_FIELDS.datos,
  });
  if ("fieldErrors" in parsed) {
    return { fieldErrors: parsed.fieldErrors, values: extractFormValues(formData) };
  }

  const token = await getSessionToken();
  let id: string;
  try {
    ({ id } = await createProperty(token, parsed.input));
  } catch (error) {
    return toPropertyFormErrorState(error, formData);
  }

  revalidatePath("/admin/propiedades");
  redirect(`/admin/propiedades/${id}?paso=fotos&creada=1`);
}

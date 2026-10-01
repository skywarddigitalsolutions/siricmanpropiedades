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
import { getSessionToken } from "@/lib/session/dal";

/**
 * Creates a draft property and sends the user to its editor, where photos can
 * be added right away. `redirect()` stays outside the try/catch (it throws).
 */
export async function createPropertyAction(
  _prevState: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const parsed = parsePropertyForm(formData);
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
  redirect(`/admin/propiedades/${id}?creada=1`);
}

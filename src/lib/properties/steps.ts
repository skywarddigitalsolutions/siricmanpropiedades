/**
 * The guided property editor (feature 16 T3): four steps addressed by the
 * `paso` query param, and which form fields each saving step owns. Plain
 * module, used by server pages/actions and client components alike.
 */
import type { CreatePropertyInput } from "@/lib/api/properties";

export const STEP_IDS = ["datos", "fotos", "descripcion", "vista-previa"] as const;
export type StepId = (typeof STEP_IDS)[number];

export const STEPS: { id: StepId; label: string }[] = [
  { id: "datos", label: "Datos" },
  { id: "fotos", label: "Fotos" },
  { id: "descripcion", label: "Descripción y extras" },
  { id: "vista-previa", label: "Vista previa" },
];

export function parseStep(value: string | string[] | undefined): StepId {
  const first = Array.isArray(value) ? value[0] : value;
  return (STEP_IDS as readonly string[]).includes(first ?? "")
    ? (first as StepId)
    : "datos";
}

export function stepHref(propertyId: string, step: StepId): string {
  return `/admin/propiedades/${propertyId}?paso=${step}`;
}

/** The two steps that save form fields (photos and preview have their own actions). */
export type FormStep = "datos" | "extras";

export const FORM_STEP_BY_STEP = {
  datos: "datos",
  descripcion: "extras",
} as const satisfies Partial<Record<StepId, FormStep>>;

type Field = keyof CreatePropertyInput;

export const STEP_FIELDS: Record<FormStep, readonly Field[]> = {
  // The 13 required fields (back DTO) plus the optional ones that sit with them.
  datos: [
    "operation",
    "type",
    "title",
    "neighborhoodId",
    "address",
    "showExactAddress",
    "currency",
    "price",
    "expenses",
    "rooms",
    "bedrooms",
    "bathrooms",
    "hasGarage",
    "coveredArea",
    "totalArea",
    "age",
  ],
  extras: [
    "description",
    "marketingTag",
    "featured",
    "creditEligible",
    "petsAllowed",
    "immediateAvailability",
    "hasWater",
    "hasNaturalGas",
    "hasSewer",
    "hasElectricity",
    "hasInternet",
  ],
};

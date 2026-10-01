/**
 * Pure, client-independent parsing/validation for the property create/edit
 * form (feature 6 T4). Plain module (no `server-only`): the form component
 * uses the exported types and `DEFAULT_FORM_VALUES`; the route `actions.ts`
 * files call `parsePropertyForm`/`mapApiErrorToFields`; `toFormValues` builds
 * the edit page's initial defaults from a fetched `Property`.
 *
 * Mirrors `CreatePropertyDto`/`UpdatePropertyDto`
 * (`back-siricmanpropiedades/src/properties/dto/*.ts`) with Spanish messages,
 * since the back's own validation messages are in English and are only
 * surfaced (via `mapApiErrorToFields`) as a fallback for whatever this client
 * validation does not already catch (e.g. a race on `neighborhoodId`).
 *
 * PATCH-clearing finding (verified against
 * `back-siricmanpropiedades/src/properties/services/properties.service.ts`,
 * `update()`): the service does `if (value === undefined) continue;` per
 * field, so an *omitted* key leaves the stored value untouched, but an
 * *explicit* `null` passes `class-validator`'s `@IsOptional()` (which only
 * special-cases `null`/`undefined`, skipping the rest of that field's
 * decorators) and is assigned as-is — clearing the column. So the only way
 * to clear `description`/`expenses` from the edit form is to send `null`,
 * never to omit the key. Create mode has no such concept (there is nothing to
 * clear yet), so an empty optional field is simply omitted there, matching
 * `CreatePropertyInput`'s plain `?: string`/`?: number` optionality.
 */
import { CURRENCIES, MARKETING_TAGS, OPERATIONS, PROPERTY_TYPES } from "./enums";
import type { CreatePropertyInput, Property } from "@/lib/api/properties";

export type PropertyFormMode = "create" | "edit";

/** `Partial<CreatePropertyInput>` with `description`/`expenses` nullable to clear them (see module doc). */
export type UpdatePropertyFormInput = Omit<
  CreatePropertyInput,
  "description" | "expenses"
> & {
  description?: string | null;
  expenses?: number | null;
};

export type PropertyFieldErrors = Partial<
  Record<keyof CreatePropertyInput, string>
> & { general?: string };

/** String/boolean representation of every form field, for `defaultValue`/`defaultChecked`. */
export type PropertyFormValues = {
  operation: string;
  type: string;
  title: string;
  description: string;
  neighborhoodId: string;
  address: string;
  showExactAddress: boolean;
  currency: string;
  price: string;
  expenses: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  hasGarage: boolean;
  coveredArea: string;
  totalArea: string;
  age: string;
  creditEligible: boolean;
  petsAllowed: boolean;
  immediateAvailability: boolean;
  marketingTag: string;
  featured: boolean;
  hasWater: boolean;
  hasNaturalGas: boolean;
  hasSewer: boolean;
  hasElectricity: boolean;
  hasInternet: boolean;
};

/** Defaults for a brand-new create form (no `initialValues` supplied). */
export const DEFAULT_FORM_VALUES: PropertyFormValues = {
  operation: "",
  type: "",
  title: "",
  description: "",
  neighborhoodId: "",
  address: "",
  showExactAddress: false,
  currency: "",
  price: "",
  expenses: "",
  rooms: "",
  bedrooms: "",
  bathrooms: "",
  hasGarage: false,
  coveredArea: "",
  totalArea: "",
  age: "",
  creditEligible: false,
  petsAllowed: false,
  immediateAvailability: false,
  marketingTag: "none",
  featured: false,
  hasWater: false,
  hasNaturalGas: false,
  hasSewer: false,
  hasElectricity: false,
  hasInternet: false,
};

const KNOWN_FIELDS = new Set<keyof CreatePropertyInput>([
  "operation",
  "type",
  "title",
  "description",
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
  "creditEligible",
  "petsAllowed",
  "immediateAvailability",
  "marketingTag",
  "featured",
  "hasWater",
  "hasNaturalGas",
  "hasSewer",
  "hasElectricity",
  "hasInternet",
]);

function rawString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Checkbox absent → false (no `value` is ever posted for an unchecked box). */
function getChecked(formData: FormData, name: string): boolean {
  return formData.get(name) !== null;
}

/**
 * Normalizes an es-AR formatted number string to a plain JS-parseable one,
 * documenting the exact rule (task T4):
 * - A comma is always the decimal separator; any dots before it are
 *   thousands separators and are stripped (`"120.000,50"` → `120000.50`,
 *   `"120000,50"` → `120000.50`).
 * - With no comma, a dot is a thousands separator when it (and every other
 *   dot in the string) is followed by exactly 3 digits (`"120.000"` →
 *   `120000`, `"1.234.567"` → `1234567`); otherwise the *last* dot is the
 *   decimal point and any earlier dots are thousands separators
 *   (`"120000.5"` → `120000.5`, `"120.50"` → `120.50`).
 * Returns `null` for anything else (letters, more than one comma, a leading
 * separator, etc.) so the caller reports a validation error.
 */
function parseLocalizedNumber(
  raw: string,
): { value: number; decimalPlaces: number } | null {
  if (!/^\d[\d.,]*$/.test(raw)) return null;

  let normalized: string;
  if (raw.includes(",")) {
    const parts = raw.split(",");
    if (parts.length !== 2 || parts[1].length === 0) return null;
    const [integerPart, decimalPart] = parts;
    normalized = `${integerPart.replace(/\./g, "")}.${decimalPart}`;
  } else if (raw.includes(".")) {
    const groups = raw.split(".");
    const isThousandsGrouping = groups.every(
      (group, index) => (index === 0 ? group.length >= 1 : group.length === 3),
    );
    if (isThousandsGrouping) {
      normalized = groups.join("");
    } else {
      const lastDotIndex = raw.lastIndexOf(".");
      const integerPart = raw.slice(0, lastDotIndex).replace(/\./g, "");
      const decimalPart = raw.slice(lastDotIndex + 1);
      normalized = `${integerPart}.${decimalPart}`;
    }
  } else {
    normalized = raw;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  const decimalPlaces = normalized.includes(".")
    ? normalized.split(".")[1].length
    : 0;
  return { value, decimalPlaces };
}

type NumberFieldOptions = {
  label: string;
  required: boolean;
  integer?: boolean;
  maxDecimals?: number;
  min?: number;
  exclusiveMin?: number;
  max?: number;
};

function validateNumberField(
  formData: FormData,
  name: string,
  opts: NumberFieldOptions,
): { value?: number; error?: string } {
  const raw = rawString(formData, name).trim();
  if (!raw) {
    return opts.required ? { error: `${opts.label} es obligatorio.` } : {};
  }

  const parsed = parseLocalizedNumber(raw);
  if (!parsed) {
    return { error: `${opts.label} debe ser un número válido.` };
  }
  const { value, decimalPlaces } = parsed;

  if (opts.integer && !Number.isInteger(value)) {
    return { error: `${opts.label} debe ser un número entero.` };
  }
  if (opts.maxDecimals !== undefined && decimalPlaces > opts.maxDecimals) {
    return {
      error: `${opts.label} admite hasta ${opts.maxDecimals} decimales.`,
    };
  }
  if (opts.exclusiveMin !== undefined && value <= opts.exclusiveMin) {
    return { error: `${opts.label} debe ser mayor a ${opts.exclusiveMin}.` };
  }
  if (opts.min !== undefined && value < opts.min) {
    return { error: `${opts.label} debe ser mayor o igual a ${opts.min}.` };
  }
  if (opts.max !== undefined && value > opts.max) {
    return { error: `${opts.label} debe ser menor o igual a ${opts.max}.` };
  }

  return { value };
}

type StringFieldOptions = {
  label: string;
  required: boolean;
  min?: number;
  max?: number;
};

function validateStringField(
  formData: FormData,
  name: string,
  opts: StringFieldOptions,
): { value?: string; error?: string } {
  const raw = rawString(formData, name).trim();
  if (!raw) {
    return opts.required ? { error: `${opts.label} es obligatorio.` } : {};
  }
  if (opts.min !== undefined && raw.length < opts.min) {
    return {
      error:
        opts.max !== undefined
          ? `${opts.label} debe tener entre ${opts.min} y ${opts.max} caracteres.`
          : `${opts.label} debe tener al menos ${opts.min} caracteres.`,
    };
  }
  if (opts.max !== undefined && raw.length > opts.max) {
    return {
      error:
        opts.min !== undefined
          ? `${opts.label} debe tener entre ${opts.min} y ${opts.max} caracteres.`
          : `${opts.label} no puede superar los ${opts.max} caracteres.`,
    };
  }
  return { value: raw };
}

function validateEnumField<T extends string>(
  formData: FormData,
  name: string,
  allowed: readonly T[],
  label: string,
): { value?: T; error?: string } {
  const raw = rawString(formData, name).trim();
  if (!raw || !(allowed as readonly string[]).includes(raw)) {
    return { error: `Seleccioná ${label}.` };
  }
  return { value: raw as T };
}

export function parsePropertyForm(
  formData: FormData,
  options: { mode: "edit" },
): { input: UpdatePropertyFormInput } | { fieldErrors: PropertyFieldErrors };
export function parsePropertyForm(
  formData: FormData,
  options?: { mode?: "create" },
): { input: CreatePropertyInput } | { fieldErrors: PropertyFieldErrors };
export function parsePropertyForm(
  formData: FormData,
  options: { mode?: PropertyFormMode } = {},
):
  | { input: CreatePropertyInput | UpdatePropertyFormInput }
  | { fieldErrors: PropertyFieldErrors } {
  const mode = options.mode ?? "create";
  const fieldErrors: PropertyFieldErrors = {};

  const operation = validateEnumField(formData, "operation", OPERATIONS, "una operación");
  if (operation.error) fieldErrors.operation = operation.error;
  const type = validateEnumField(formData, "type", PROPERTY_TYPES, "un tipo de propiedad");
  if (type.error) fieldErrors.type = type.error;
  const title = validateStringField(formData, "title", {
    label: "El título",
    required: true,
    min: 5,
    max: 150,
  });
  if (title.error) fieldErrors.title = title.error;
  const description = validateStringField(formData, "description", {
    label: "La descripción",
    required: false,
    max: 5000,
  });
  if (description.error) fieldErrors.description = description.error;
  const neighborhoodId = validateStringField(formData, "neighborhoodId", {
    label: "El barrio",
    required: true,
  });
  if (neighborhoodId.error) fieldErrors.neighborhoodId = "Seleccioná un barrio.";
  const address = validateStringField(formData, "address", {
    label: "La dirección",
    required: true,
    min: 3,
    max: 200,
  });
  if (address.error) fieldErrors.address = address.error;
  const currency = validateEnumField(formData, "currency", CURRENCIES, "una moneda");
  if (currency.error) fieldErrors.currency = currency.error;
  const price = validateNumberField(formData, "price", {
    label: "El precio",
    required: true,
    maxDecimals: 2,
    exclusiveMin: 0,
    max: 999999999999,
  });
  if (price.error) fieldErrors.price = price.error;
  const expenses = validateNumberField(formData, "expenses", {
    label: "Las expensas",
    required: false,
    maxDecimals: 2,
    min: 0,
  });
  if (expenses.error) fieldErrors.expenses = expenses.error;
  const rooms = validateNumberField(formData, "rooms", {
    label: "Los ambientes",
    required: true,
    integer: true,
    min: 0,
    max: 50,
  });
  if (rooms.error) fieldErrors.rooms = rooms.error;
  const bedrooms = validateNumberField(formData, "bedrooms", {
    label: "Los dormitorios",
    required: true,
    integer: true,
    min: 0,
    max: 50,
  });
  if (bedrooms.error) fieldErrors.bedrooms = bedrooms.error;
  const bathrooms = validateNumberField(formData, "bathrooms", {
    label: "Los baños",
    required: true,
    integer: true,
    min: 0,
    max: 50,
  });
  if (bathrooms.error) fieldErrors.bathrooms = bathrooms.error;
  const coveredArea = validateNumberField(formData, "coveredArea", {
    label: "La superficie cubierta",
    required: true,
    maxDecimals: 2,
    min: 0,
    max: 1000000,
  });
  if (coveredArea.error) fieldErrors.coveredArea = coveredArea.error;
  const totalArea = validateNumberField(formData, "totalArea", {
    label: "La superficie total",
    required: true,
    maxDecimals: 2,
    min: 0,
    max: 1000000,
  });
  if (totalArea.error) fieldErrors.totalArea = totalArea.error;
  const age = validateNumberField(formData, "age", {
    label: "La antigüedad",
    required: true,
    integer: true,
    min: 0,
    max: 300,
  });
  if (age.error) fieldErrors.age = age.error;
  const marketingTag = validateEnumField(
    formData,
    "marketingTag",
    MARKETING_TAGS,
    "una etiqueta comercial",
  );
  if (marketingTag.error) fieldErrors.marketingTag = marketingTag.error;

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const input: CreatePropertyInput = {
    operation: operation.value!,
    type: type.value!,
    title: title.value!,
    neighborhoodId: neighborhoodId.value!,
    address: address.value!,
    showExactAddress: getChecked(formData, "showExactAddress"),
    currency: currency.value!,
    price: price.value!,
    rooms: rooms.value!,
    bedrooms: bedrooms.value!,
    bathrooms: bathrooms.value!,
    hasGarage: getChecked(formData, "hasGarage"),
    coveredArea: coveredArea.value!,
    totalArea: totalArea.value!,
    age: age.value!,
    creditEligible: getChecked(formData, "creditEligible"),
    petsAllowed: getChecked(formData, "petsAllowed"),
    immediateAvailability: getChecked(formData, "immediateAvailability"),
    marketingTag: marketingTag.value!,
    featured: getChecked(formData, "featured"),
    hasWater: getChecked(formData, "hasWater"),
    hasNaturalGas: getChecked(formData, "hasNaturalGas"),
    hasSewer: getChecked(formData, "hasSewer"),
    hasElectricity: getChecked(formData, "hasElectricity"),
    hasInternet: getChecked(formData, "hasInternet"),
  };

  if (mode === "edit") {
    const editInput: UpdatePropertyFormInput = {
      ...input,
      description: description.value ?? null,
      expenses: expenses.value ?? null,
    };
    return { input: editInput };
  }

  if (description.value !== undefined) input.description = description.value;
  if (expenses.value !== undefined) input.expenses = expenses.value;

  return { input };
}

/**
 * Re-extracts raw submitted values (unvalidated) so a failed submission can
 * re-render the form with everything the user typed, per `design.md`'s
 * "preserve user input on error".
 */
export function extractFormValues(formData: FormData): PropertyFormValues {
  return {
    operation: rawString(formData, "operation"),
    type: rawString(formData, "type"),
    title: rawString(formData, "title"),
    description: rawString(formData, "description"),
    neighborhoodId: rawString(formData, "neighborhoodId"),
    address: rawString(formData, "address"),
    showExactAddress: getChecked(formData, "showExactAddress"),
    currency: rawString(formData, "currency"),
    price: rawString(formData, "price"),
    expenses: rawString(formData, "expenses"),
    rooms: rawString(formData, "rooms"),
    bedrooms: rawString(formData, "bedrooms"),
    bathrooms: rawString(formData, "bathrooms"),
    hasGarage: getChecked(formData, "hasGarage"),
    coveredArea: rawString(formData, "coveredArea"),
    totalArea: rawString(formData, "totalArea"),
    age: rawString(formData, "age"),
    creditEligible: getChecked(formData, "creditEligible"),
    petsAllowed: getChecked(formData, "petsAllowed"),
    immediateAvailability: getChecked(formData, "immediateAvailability"),
    marketingTag: rawString(formData, "marketingTag"),
    featured: getChecked(formData, "featured"),
    hasWater: getChecked(formData, "hasWater"),
    hasNaturalGas: getChecked(formData, "hasNaturalGas"),
    hasSewer: getChecked(formData, "hasSewer"),
    hasElectricity: getChecked(formData, "hasElectricity"),
    hasInternet: getChecked(formData, "hasInternet"),
  };
}

/**
 * Maps the back's Nest validation messages (`ApiError.details`, e.g.
 * `"price must be a positive number"`) to the field they describe — the
 * message's first token is always the DTO property name. Anything that does
 * not match a known field (e.g. `"Neighborhood not found"`) is bucketed into
 * `general` instead of being silently dropped.
 */
export function mapApiErrorToFields(details: string[]): PropertyFieldErrors {
  const fieldErrors: PropertyFieldErrors = {};
  const generalMessages: string[] = [];

  for (const detail of details) {
    const token = detail.match(/^(\w+)\b/)?.[1];
    const field = token as keyof CreatePropertyInput | undefined;
    if (field && KNOWN_FIELDS.has(field)) {
      fieldErrors[field] = fieldErrors[field]
        ? `${fieldErrors[field]} ${detail}`
        : detail;
    } else {
      generalMessages.push(detail);
    }
  }

  if (generalMessages.length > 0) {
    fieldErrors.general = generalMessages.join(" ");
  }

  return fieldErrors;
}

/** Builds the edit form's initial `PropertyFormValues` from a fetched `Property`. */
export function toFormValues(property: Property): PropertyFormValues {
  return {
    operation: property.operation,
    type: property.type,
    title: property.title,
    description: property.description ?? "",
    neighborhoodId: property.neighborhood.id,
    address: property.address,
    showExactAddress: property.showExactAddress,
    currency: property.currency,
    price: String(property.price),
    expenses: property.expenses === null ? "" : String(property.expenses),
    rooms: String(property.rooms),
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    hasGarage: property.hasGarage,
    coveredArea: String(property.coveredArea),
    totalArea: String(property.totalArea),
    age: String(property.age),
    creditEligible: property.creditEligible,
    petsAllowed: property.petsAllowed,
    immediateAvailability: property.immediateAvailability,
    marketingTag: property.marketingTag,
    featured: property.featured,
    hasWater: property.hasWater,
    hasNaturalGas: property.hasNaturalGas,
    hasSewer: property.hasSewer,
    hasElectricity: property.hasElectricity,
    hasInternet: property.hasInternet,
  };
}

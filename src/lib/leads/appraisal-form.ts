import { mapLeadApiErrors, parseInquiryForm, type InquiryInput } from "./inquiry-form";
import type { LeadTopic } from "./labels";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/properties/enums";

/**
 * Tasaciones page form: the inquiry fields (name, phone, message) plus the
 * property data the API accepts in `details`. Only the name and the phone are
 * required; every property field is optional and left out when blank. Name,
 * phone and message validation delegates to the inquiry parser so the back's
 * contract lives in one place; the `details` limits mirror `AppraisalDetailsDto`.
 */
export type AppraisalOperation = "sell" | "rent";

export type AppraisalInput = InquiryInput & {
  topic: Extract<LeadTopic, AppraisalOperation>;
  /** Left out when the visitor gave no property data. */
  details?: AppraisalDetails;
};

export type AppraisalDetails = {
  propertyType?: PropertyType;
  address?: string;
  /** Barrio name, as the catalog lists it. */
  neighborhood?: string;
  rooms?: number;
  area?: number;
};

export type AppraisalField =
  | "operation"
  | "propertyType"
  | "address"
  | "neighborhood"
  | "rooms"
  | "area"
  | "name"
  | "phone"
  | "message";
export type AppraisalFieldErrors = Partial<Record<AppraisalField | "general", string>>;

/** `useActionState` state of the appraisal form. */
export type AppraisalState = {
  status: "idle" | "sent" | "error";
  fieldErrors?: AppraisalFieldErrors;
  /** What the visitor typed, to refill the form after an error. */
  values?: Partial<Record<AppraisalField, string>>;
};

const ADDRESS_MAX = 200;
const NEIGHBORHOOD_MAX = 100;
const ROOMS_MAX = 50;
const AREA_MAX = 1_000_000;

const MESSAGES = {
  operation: "Elegí si querés vender o alquilar.",
  propertyType: "Elegí el tipo de propiedad.",
  address: `La dirección puede tener hasta ${ADDRESS_MAX} caracteres.`,
  neighborhood: "Elegí un barrio de la lista.",
  // The form has no email field, unlike the shared inquiry rule.
  phoneRequired: "Dejanos un teléfono para responderte.",
  rooms: `Los ambientes deben ser un número entero de 0 a ${ROOMS_MAX}.`,
  area: `La superficie debe ser un número entero de 0 a ${AREA_MAX} m².`,
};

const OPERATIONS: readonly AppraisalOperation[] = ["sell", "rent"];

const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const isOperation = (value: string): value is AppraisalOperation =>
  (OPERATIONS as readonly string[]).includes(value);

const isPropertyType = (value: string): value is PropertyType =>
  (PROPERTY_TYPES as readonly string[]).includes(value);

/** Optional whole number within `0..max`; `undefined` when blank, `null` when invalid. */
function optionalInteger(raw: string, max: number): number | undefined | null {
  if (!raw) return undefined;
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return value <= max ? value : null;
}

export function parseAppraisalForm(
  data: FormData,
): { input: AppraisalInput } | { fieldErrors: AppraisalFieldErrors } {
  const operation = text(data, "operation");
  const propertyType = text(data, "propertyType");
  const address = text(data, "address");
  const neighborhood = text(data, "neighborhood");
  const rooms = optionalInteger(text(data, "rooms"), ROOMS_MAX);
  const area = optionalInteger(text(data, "area"), AREA_MAX);

  const inquiry = new FormData();
  for (const key of ["name", "phone", "message", "website"]) inquiry.set(key, text(data, key));
  const parsed = parseInquiryForm(inquiry);

  const fieldErrors: AppraisalFieldErrors = "fieldErrors" in parsed ? { ...parsed.fieldErrors } : {};
  if (!text(data, "phone")) fieldErrors.phone = MESSAGES.phoneRequired;
  if (!isOperation(operation)) fieldErrors.operation = MESSAGES.operation;
  if (propertyType && !isPropertyType(propertyType)) fieldErrors.propertyType = MESSAGES.propertyType;
  if (address.length > ADDRESS_MAX) fieldErrors.address = MESSAGES.address;
  if (neighborhood.length > NEIGHBORHOOD_MAX) fieldErrors.neighborhood = MESSAGES.neighborhood;
  if (rooms === null) fieldErrors.rooms = MESSAGES.rooms;
  if (area === null) fieldErrors.area = MESSAGES.area;

  if ("fieldErrors" in parsed || !isOperation(operation) || Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const details: AppraisalDetails = {
    ...(isPropertyType(propertyType) ? { propertyType } : {}),
    ...(address ? { address } : {}),
    ...(neighborhood ? { neighborhood } : {}),
    ...(rooms != null ? { rooms } : {}),
    ...(area != null ? { area } : {}),
  };

  return {
    input: {
      ...parsed.input,
      topic: operation,
      ...(Object.keys(details).length > 0 ? { details } : {}),
    },
  };
}

const DETAIL_FIELDS = ["propertyType", "address", "neighborhood", "rooms", "area"] as const;
const DETAIL_MESSAGES: Record<(typeof DETAIL_FIELDS)[number], string> = {
  propertyType: MESSAGES.propertyType,
  address: MESSAGES.address,
  neighborhood: MESSAGES.neighborhood,
  rooms: MESSAGES.rooms,
  area: MESSAGES.area,
};

/** Maps the API's validation messages (`details.rooms ...`, `name ...`) to friendly ones. */
export function mapAppraisalApiErrors(details: string[]): AppraisalFieldErrors {
  const fieldErrors: AppraisalFieldErrors = {};
  for (const detail of details) {
    const field = detail.split(" ")[0];
    const nested = DETAIL_FIELDS.find((name) => field === `details.${name}`);
    if (nested) {
      fieldErrors[nested] = DETAIL_MESSAGES[nested];
      continue;
    }
    // Email is not in this form: a rejected contact value is the phone.
    const { email, ...rest } = mapLeadApiErrors([detail]);
    const phone = rest.phone ?? email;
    Object.assign(fieldErrors, rest, phone ? { phone } : {});
  }
  return fieldErrors;
}

export function appraisalValues(data: FormData): Partial<Record<AppraisalField, string>> {
  return {
    operation: text(data, "operation"),
    propertyType: text(data, "propertyType"),
    address: text(data, "address"),
    neighborhood: text(data, "neighborhood"),
    rooms: text(data, "rooms"),
    area: text(data, "area"),
    name: text(data, "name"),
    phone: text(data, "phone"),
    message: text(data, "message"),
  };
}

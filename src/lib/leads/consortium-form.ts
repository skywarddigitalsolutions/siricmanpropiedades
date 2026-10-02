import { mapContactApiErrors } from "./contact-form";
import { parseInquiryForm, type InquiryInput } from "./inquiry-form";

/**
 * Consortium administration form: a contact lead with the `consortium` topic.
 * The API has no building fields for contact leads, so the address and the
 * unit count travel at the top of the message (the inbox shows them there).
 */
export type ConsortiumInput = InquiryInput & { type: "contact"; topic: "consortium" };

export type ConsortiumField = "name" | "contact" | "address" | "units" | "message";
export type ConsortiumFieldErrors = Partial<Record<ConsortiumField | "general", string>>;

/** `useActionState` state of the consortium form. */
export type ConsortiumState = {
  status: "idle" | "sent" | "error";
  fieldErrors?: ConsortiumFieldErrors;
  /** What the visitor typed, to refill the form after an error. */
  values?: Partial<Record<ConsortiumField, string>>;
};

/** The API caps a message at 2000 characters; the building lines need room. */
export const CONSORTIUM_MESSAGE_MAX = 1500;
const ADDRESS_MAX = 200;
const UNITS_MAX = 9999;

const MESSAGES = {
  address: "Indicá la dirección del edificio.",
  units: "Ingresá un número entero de unidades (por ejemplo, 24).",
  message: `El mensaje puede tener hasta ${CONSORTIUM_MESSAGE_MAX} caracteres.`,
};

const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export function parseConsortiumForm(
  data: FormData,
): { input: ConsortiumInput } | { fieldErrors: ConsortiumFieldErrors } {
  const contact = text(data, "contact");
  const address = text(data, "address");
  const units = text(data, "units");
  const message = text(data, "message");

  const fieldErrors: ConsortiumFieldErrors = {};
  if (!address || address.length > ADDRESS_MAX) fieldErrors.address = MESSAGES.address;
  if (units && !(/^\d{1,4}$/.test(units) && Number(units) >= 1 && Number(units) <= UNITS_MAX)) {
    fieldErrors.units = MESSAGES.units;
  }
  if (message.length > CONSORTIUM_MESSAGE_MAX) fieldErrors.message = MESSAGES.message;

  // Name, phone/email and the honeypot go through the shared inquiry rules.
  const inquiry = new FormData();
  inquiry.set("name", text(data, "name"));
  inquiry.set(contact.includes("@") ? "email" : "phone", contact);
  inquiry.set("website", text(data, "website"));
  const parsed = parseInquiryForm(inquiry);
  if ("fieldErrors" in parsed) {
    const { phone, email, ...rest } = parsed.fieldErrors;
    const contactError = phone ?? email;
    Object.assign(fieldErrors, rest, contactError ? { contact: contactError } : {});
  }

  if ("fieldErrors" in parsed || Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const body = [
    `Dirección del edificio: ${address}`,
    ...(units ? [`Unidades aproximadas: ${units}`] : []),
    ...(message ? ["", message] : []),
  ].join("\n");

  return { input: { type: "contact", topic: "consortium", ...parsed.input, message: body } };
}

export function consortiumValues(data: FormData): Partial<Record<ConsortiumField, string>> {
  return {
    name: text(data, "name"),
    contact: text(data, "contact"),
    address: text(data, "address"),
    units: text(data, "units"),
    message: text(data, "message"),
  };
}

/** API validation messages (first word = field) onto this form's fields. */
export function mapConsortiumApiErrors(details: string[]): ConsortiumFieldErrors {
  // The API never reports `topic` (it is fixed here), so the shapes line up.
  const errors = { ...mapContactApiErrors(details) };
  delete errors.topic;
  return errors;
}

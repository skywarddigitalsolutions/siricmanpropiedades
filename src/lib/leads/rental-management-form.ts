import { mapContactApiErrors } from "./contact-form";
import { parseInquiryForm, type InquiryInput } from "./inquiry-form";

/**
 * Rental management form: a contact lead with the `rental_management` topic.
 * The API has no property fields for contact leads, so the address and the
 * rental status travel at the top of the message (the inbox shows them there).
 */
export type RentalInput = InquiryInput & { type: "contact"; topic: "rental_management" };

export type RentalField = "name" | "contact" | "address" | "rented" | "message";
export type RentalFieldErrors = Partial<Record<RentalField | "general", string>>;

/** `useActionState` state of the rental management form. */
export type RentalState = {
  status: "idle" | "sent" | "error";
  fieldErrors?: RentalFieldErrors;
  /** What the visitor typed, to refill the form after an error. */
  values?: Partial<Record<RentalField, string>>;
};

/** The API caps a message at 2000 characters; the property lines need room. */
export const RENTAL_MESSAGE_MAX = 1500;
const ADDRESS_MAX = 200;

/** Answers of "¿La propiedad está alquilada?", as the message will show them. */
export const RENTED_OPTIONS = {
  yes: "Sí, ya tiene inquilino",
  no: "No, la quiero alquilar",
} as const;

const MESSAGES = {
  address: "Indicá la dirección de la propiedad.",
  rented: "Contanos si la propiedad ya está alquilada.",
  message: `El mensaje puede tener hasta ${RENTAL_MESSAGE_MAX} caracteres.`,
};

const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const isRented = (value: string): value is keyof typeof RENTED_OPTIONS =>
  Object.hasOwn(RENTED_OPTIONS, value);

export function parseRentalForm(
  data: FormData,
): { input: RentalInput } | { fieldErrors: RentalFieldErrors } {
  const contact = text(data, "contact");
  const address = text(data, "address");
  const rented = text(data, "rented");
  const message = text(data, "message");

  const fieldErrors: RentalFieldErrors = {};
  if (!address || address.length > ADDRESS_MAX) fieldErrors.address = MESSAGES.address;
  if (!isRented(rented)) fieldErrors.rented = MESSAGES.rented;
  if (message.length > RENTAL_MESSAGE_MAX) fieldErrors.message = MESSAGES.message;

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

  if ("fieldErrors" in parsed || !isRented(rented) || Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const body = [
    `Dirección de la propiedad: ${address}`,
    `¿Está alquilada?: ${RENTED_OPTIONS[rented]}`,
    ...(message ? ["", message] : []),
  ].join("\n");

  return { input: { type: "contact", topic: "rental_management", ...parsed.input, message: body } };
}

export function rentalValues(data: FormData): Partial<Record<RentalField, string>> {
  return {
    name: text(data, "name"),
    contact: text(data, "contact"),
    address: text(data, "address"),
    rented: text(data, "rented"),
    message: text(data, "message"),
  };
}

/** API validation messages (first word = field) onto this form's fields. */
export function mapRentalApiErrors(details: string[]): RentalFieldErrors {
  // The API never reports `topic` (it is fixed here), so the shapes line up.
  const errors = { ...mapContactApiErrors(details) };
  delete errors.topic;
  return errors;
}

/**
 * Validation for the public inquiry form, mirroring the API's CreateLeadDto
 * with friendly Spanish messages. The API validates again; this keeps errors
 * next to the fields without a round trip.
 */
export type InquiryInput = {
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  /** Honeypot: empty for people; the API silently drops filled ones. */
  website?: string;
};

export type InquiryField = "name" | "phone" | "email" | "message";
export type InquiryFieldErrors = Partial<Record<InquiryField | "general", string>>;

const PHONE_PATTERN = /^[0-9+()\s-]{6,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MESSAGES = {
  name: "Escribí tu nombre (2 a 100 caracteres).",
  phone: "Revisá el teléfono.",
  email: "Revisá el email.",
  message: "El mensaje puede tener hasta 2000 caracteres.",
  contact: "Dejanos un teléfono o un email para responderte.",
  general: "No pudimos enviar la consulta. Revisá los datos e intentá de nuevo.",
};

const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export function parseInquiryForm(
  data: FormData,
): { input: InquiryInput } | { fieldErrors: InquiryFieldErrors } {
  const name = text(data, "name");
  const phone = text(data, "phone");
  const email = text(data, "email");
  const message = text(data, "message");
  const website = text(data, "website");
  const fieldErrors: InquiryFieldErrors = {};

  if (name.length < 2 || name.length > 100) fieldErrors.name = MESSAGES.name;
  if (!phone && !email) fieldErrors.phone = MESSAGES.contact;
  if (phone && !PHONE_PATTERN.test(phone)) fieldErrors.phone = MESSAGES.phone;
  if (email && (email.length > 254 || !EMAIL_PATTERN.test(email))) fieldErrors.email = MESSAGES.email;
  if (message.length > 2000) fieldErrors.message = MESSAGES.message;

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    input: {
      name,
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
      ...(message ? { message } : {}),
      ...(website ? { website } : {}),
    },
  };
}

/** Maps the API's validation messages (first word = field) to friendly ones. */
export function mapLeadApiErrors(details: string[]): InquiryFieldErrors {
  const fieldErrors: InquiryFieldErrors = {};
  for (const detail of details) {
    const field = detail.split(" ")[0];
    if (field === "name" || field === "phone" || field === "email" || field === "message") {
      fieldErrors[field] = MESSAGES[field];
    } else {
      fieldErrors.general = MESSAGES.general;
    }
  }
  return fieldErrors;
}

/** `useActionState` state of the inquiry form. */
export type InquiryState = {
  status: "idle" | "sent" | "error";
  fieldErrors?: InquiryFieldErrors;
  /** What the visitor typed, to refill the form after an error. */
  values?: Partial<Record<InquiryField, string>>;
};

export function inquiryValues(data: FormData): Partial<Record<InquiryField, string>> {
  return {
    name: text(data, "name"),
    phone: text(data, "phone"),
    email: text(data, "email"),
    message: text(data, "message"),
  };
}

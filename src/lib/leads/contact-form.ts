import {
  mapLeadApiErrors,
  parseInquiryForm,
  type InquiryFieldErrors,
  type InquiryInput,
} from "./inquiry-form";
import { LEAD_TOPICS, type LeadTopic } from "./labels";

/**
 * Contacto page form: like the inquiry form, but with a single
 * "Teléfono o email" input and a topic. Parsing delegates to the inquiry
 * parser so the back's contract (name 2-100, message max 2000, phone or
 * email required) lives in one place.
 */
export type ContactInput = InquiryInput & { topic: LeadTopic };

export type ContactField = "name" | "contact" | "topic" | "message";
export type ContactFieldErrors = Partial<Record<ContactField | "general", string>>;

/** `useActionState` state of the contact form. */
export type ContactState = {
  status: "idle" | "sent" | "error";
  fieldErrors?: ContactFieldErrors;
  /** What the visitor typed, to refill the form after an error. */
  values?: Partial<Record<ContactField, string>>;
};

const TOPIC_MESSAGE = "Elegí un motivo de consulta.";

const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const isTopic = (value: string): value is LeadTopic => (LEAD_TOPICS as readonly string[]).includes(value);

/** Phone and email errors both belong to the single contact input. */
function toContactErrors({ phone, email, ...rest }: InquiryFieldErrors): ContactFieldErrors {
  const contact = phone ?? email;
  return { ...rest, ...(contact ? { contact } : {}) };
}

export function parseContactForm(
  data: FormData,
): { input: ContactInput } | { fieldErrors: ContactFieldErrors } {
  const contact = text(data, "contact");
  const topic = text(data, "topic");

  const inquiry = new FormData();
  inquiry.set("name", text(data, "name"));
  inquiry.set(contact.includes("@") ? "email" : "phone", contact);
  inquiry.set("message", text(data, "message"));
  inquiry.set("website", text(data, "website"));

  const parsed = parseInquiryForm(inquiry);
  const fieldErrors = "fieldErrors" in parsed ? toContactErrors(parsed.fieldErrors) : {};
  if (!isTopic(topic)) fieldErrors.topic = TOPIC_MESSAGE;

  if ("fieldErrors" in parsed || !isTopic(topic)) return { fieldErrors };
  return { input: { ...parsed.input, topic } };
}

export function mapContactApiErrors(details: string[]): ContactFieldErrors {
  return toContactErrors(mapLeadApiErrors(details));
}

export function contactValues(data: FormData): Partial<Record<ContactField, string>> {
  return {
    name: text(data, "name"),
    contact: text(data, "contact"),
    topic: text(data, "topic"),
    message: text(data, "message"),
  };
}

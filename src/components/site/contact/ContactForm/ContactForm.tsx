"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type InputHTMLAttributes } from "react";
import type { ContactField, ContactState } from "@/lib/leads/contact-form";
import { LEAD_TOPICS, LEAD_TOPIC_LABELS } from "@/lib/leads/labels";
import Select from "../../Select/Select";
import { FormHint, FormLiveRegion } from "../../forms/FormParts";
import FormSuccess from "../../forms/FormSuccess";
import { countFieldErrors, useFocusOnError } from "../../forms/useFocusOnError";
import styles from "./ContactForm.module.css";

type ContactFormProps = {
  action: (prev: ContactState, formData: FormData) => Promise<ContactState>;
};

/** Topic wording of the public form (the admin labels are third person). */
const TOPIC_OPTIONS = {
  buy: "Quiero comprar",
  rent: "Quiero alquilar",
  sell: "Quiero vender o tasar",
  consortium: LEAD_TOPIC_LABELS.consortium,
  other: LEAD_TOPIC_LABELS.other,
} as const;

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className={styles.error}>
      {error}
    </p>
  );
}

function Field({
  name,
  label,
  error,
  hint,
  ...inputProps
}: {
  name: ContactField;
  label: string;
  error?: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = `contact-${name}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ");
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {hint && <FormHint id={`${id}-hint`}>{hint}</FormHint>}
      <input
        id={id}
        name={name}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}

/** Contact form of the Contacto page (design: "Envianos un mensaje"). */
export default function ContactForm({ action }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    status: "idle",
  });

  // Remount the fields after each error so they show what the visitor typed.
  const [lastState, setLastState] = useState(state);
  const [version, setVersion] = useState(0);
  if (state !== lastState) {
    setLastState(state);
    setVersion((current) => current + 1);
  }

  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(state, formRef);

  if (state.status === "sent") {
    return <FormSuccess title="¡Mensaje enviado!" text="Te respondemos a la brevedad." />;
  }

  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  return (
    <>
      <form key={version} ref={formRef} action={formAction} className={styles.form}>
        <h2 className={styles.title}>Envianos un mensaje</h2>
        {errors.general && (
          <p role="alert" tabIndex={-1} className={styles.alert}>
            {errors.general}
          </p>
        )}
        <Field
          name="name"
          label="Nombre y apellido"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          defaultValue={values.name}
          error={errors.name}
        />
        <Field
          name="contact"
          label="Teléfono o email"
          hint="Escribí un teléfono o un email donde podamos responderte."
          autoComplete="off"
          required
          maxLength={254}
          defaultValue={values.contact}
          error={errors.contact}
        />
        <div className={styles.field}>
          <label htmlFor="contact-topic" className={styles.label}>
            Motivo de consulta
          </label>
          <Select
            id="contact-topic"
            name="topic"
            defaultValue={values.topic ?? LEAD_TOPICS[0]}
            aria-invalid={errors.topic ? true : undefined}
            aria-describedby={errors.topic ? "contact-topic-error" : undefined}
          >
            {LEAD_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {TOPIC_OPTIONS[topic]}
              </option>
            ))}
          </Select>
          <FieldError id="contact-topic" error={errors.topic} />
        </div>
        <div className={styles.field}>
          <label htmlFor="contact-message" className={styles.label}>
            Tu mensaje
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={4}
            maxLength={2000}
            defaultValue={values.message}
            className={styles.input}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
          />
          <FieldError id="contact-message" error={errors.message} />
        </div>

        {/* Honeypot: invisible to people and screen readers, filled by bots. */}
        <div aria-hidden="true" className={styles.trap}>
          <label htmlFor="contact-website">No completar</label>
          <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>
          {pending ? "Enviando…" : "Enviar"}
        </button>
        <p className={styles.privacy}>
          Usamos tus datos solo para responder tu consulta.{" "}
          <Link href="/privacidad" className={styles.privacyLink}>
            Privacidad
          </Link>
        </p>
      </form>
      <FormLiveRegion fieldErrors={countFieldErrors(errors)} />
    </>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import type { ContactField, ContactState } from "@/lib/leads/contact-form";
import { LEAD_TOPICS, LEAD_TOPIC_LABELS } from "@/lib/leads/labels";
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
  ...inputProps
}: { name: ContactField; label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = `contact-${name}`;
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}

/** Contact form of the Contacto page (design: "Envianos un mensaje"). */
export default function ContactForm({ action }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });

  // Remount the fields after each error so they show what the visitor typed.
  const [lastState, setLastState] = useState(state);
  const [version, setVersion] = useState(0);
  if (state !== lastState) {
    setLastState(state);
    setVersion((current) => current + 1);
  }

  const thanksRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === "sent") thanksRef.current?.focus();
  }, [state.status]);

  if (state.status === "sent") {
    return (
      <div ref={thanksRef} tabIndex={-1} role="status" className={styles.thanks}>
        <p className={styles.thanksTitle}>¡Mensaje enviado!</p>
        <p className={styles.thanksText}>Te respondemos a la brevedad.</p>
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  return (
    <form key={version} action={formAction} className={styles.form}>
      <h2 className={styles.title}>Envianos un mensaje</h2>
      {errors.general && (
        <p role="alert" className={styles.alert}>
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
        autoComplete="email"
        required
        maxLength={254}
        defaultValue={values.contact}
        error={errors.contact}
      />
      <div className={styles.field}>
        <label htmlFor="contact-topic" className={styles.label}>
          Motivo de consulta
        </label>
        <select
          id="contact-topic"
          name="topic"
          className={`${styles.input} ${styles.select}`}
          defaultValue={values.topic ?? LEAD_TOPICS[0]}
          aria-invalid={errors.topic ? true : undefined}
          aria-describedby={errors.topic ? "contact-topic-error" : undefined}
        >
          {LEAD_TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {TOPIC_OPTIONS[topic]}
            </option>
          ))}
        </select>
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
    </form>
  );
}

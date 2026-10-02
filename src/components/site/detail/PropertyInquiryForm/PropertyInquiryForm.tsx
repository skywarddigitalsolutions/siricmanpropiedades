"use client";

import { useActionState, useRef, useState, type InputHTMLAttributes } from "react";
import type { InquiryField, InquiryState } from "@/lib/leads/inquiry-form";
import { FormHint, FormLiveRegion, Optional } from "../../forms/FormParts";
import FormSuccess from "../../forms/FormSuccess";
import { countFieldErrors, useFocusOnError } from "../../forms/useFocusOnError";
import WhatsAppIcon from "../../WhatsAppIcon/WhatsAppIcon";
import styles from "./PropertyInquiryForm.module.css";

type PropertyInquiryFormProps = {
  action: (prev: InquiryState, formData: FormData) => Promise<InquiryState>;
  defaultMessage: string;
  whatsappHref: string;
};

function Field({
  name,
  label,
  error,
  describedBy,
  ...inputProps
}: {
  name: InquiryField;
  label: string;
  error?: string;
  /** Extra description ids (shared hints) read before the error. */
  describedBy?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = `inquiry-${name}`;
  const described = [describedBy, error && `${id}-error`].filter(Boolean).join(" ");
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
        aria-describedby={described || undefined}
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Inquiry form of the property page (design: "Consultá por esta propiedad").
 * Phone or email is enough; WhatsApp stays as the instant alternative.
 */
export default function PropertyInquiryForm({
  action,
  defaultMessage,
  whatsappHref,
}: PropertyInquiryFormProps) {
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
    return (
      <FormSuccess
        title="¡Gracias por tu consulta!"
        text="Te respondo personalmente a la brevedad."
      />
    );
  }

  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  return (
    <>
      <form
        key={version}
        ref={formRef}
        action={formAction}
        className={styles.form}
        noValidate={false}
      >
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
        <FormHint id="inquiry-contact-hint">Con un teléfono o un email alcanza.</FormHint>
        <Field
          name="phone"
          label="Teléfono"
          describedBy="inquiry-contact-hint"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={30}
          defaultValue={values.phone}
          error={errors.phone}
        />
        <Field
          name="email"
          label="Email"
          describedBy="inquiry-contact-hint"
          type="email"
          autoComplete="email"
          maxLength={254}
          defaultValue={values.email}
          error={errors.email}
        />
        <div className={styles.field}>
          <label htmlFor="inquiry-message" className={styles.label}>
            Mensaje <Optional />
          </label>
          <textarea
            id="inquiry-message"
            name="message"
            rows={3}
            maxLength={2000}
            defaultValue={values.message ?? defaultMessage}
            className={styles.input}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? "inquiry-message-error" : undefined}
          />
          {errors.message && (
            <p id="inquiry-message-error" className={styles.error}>
              {errors.message}
            </p>
          )}
        </div>

        {/* Honeypot: invisible to people and screen readers, filled by bots. */}
        <div aria-hidden="true" className={styles.trap}>
          <label htmlFor="inquiry-website">No completar</label>
          <input id="inquiry-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className={styles.actions}>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Consultar por WhatsApp"
            className={styles.whatsapp}
          >
            <WhatsAppIcon size={26} />
          </a>
          <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>
            {pending ? "Enviando…" : "Enviar consulta"}
          </button>
        </div>
      </form>
      <FormLiveRegion fieldErrors={countFieldErrors(errors)} />
    </>
  );
}

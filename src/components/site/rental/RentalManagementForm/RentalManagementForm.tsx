"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type InputHTMLAttributes } from "react";
import {
  RENTAL_MESSAGE_MAX,
  RENTED_OPTIONS,
  type RentalField,
  type RentalState,
} from "@/lib/leads/rental-management-form";
import { FormLiveRegion, Optional } from "../../forms/FormParts";
import FormSuccess from "../../forms/FormSuccess";
import { countFieldErrors, useFocusOnError } from "../../forms/useFocusOnError";
import styles from "./RentalManagementForm.module.css";

type RentalManagementFormProps = {
  action: (prev: RentalState, formData: FormData) => Promise<RentalState>;
};

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
}: {
  name: RentalField;
  label: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = `rental-${name}`;
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

/** Consultation form of the rental management page. */
export default function RentalManagementForm({ action }: RentalManagementFormProps) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });

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
        title="Recibimos tu consulta"
        text="Gabriel se comunica con vos para conocer tu propiedad."
      />
    );
  }

  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  return (
    <>
      <form key={version} ref={formRef} action={formAction} className={styles.form}>
        {errors.general && (
          <p role="alert" tabIndex={-1} className={styles.alert}>
            {errors.general}
          </p>
        )}
        <div className={styles.row}>
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
        </div>
        <Field
          name="address"
          label="Dirección de la propiedad"
          autoComplete="street-address"
          required
          maxLength={200}
          defaultValue={values.address}
          error={errors.address}
        />
        <fieldset
          className={styles.choice}
          aria-describedby={errors.rented ? "rental-rented-error" : undefined}
        >
          <legend className={styles.label}>¿La propiedad está alquilada?</legend>
          <div className={styles.options}>
            {Object.entries(RENTED_OPTIONS).map(([value, label]) => (
              <label key={value} className={styles.option}>
                <input
                  type="radio"
                  name="rented"
                  value={value}
                  className={styles.radio}
                  required
                  defaultChecked={values.rented === value}
                />
                {label}
              </label>
            ))}
          </div>
          <FieldError id="rental-rented" error={errors.rented} />
        </fieldset>
        <div className={styles.field}>
          <label htmlFor="rental-message" className={styles.label}>
            Contanos lo que necesites <Optional />
          </label>
          <textarea
            id="rental-message"
            name="message"
            rows={4}
            maxLength={RENTAL_MESSAGE_MAX}
            defaultValue={values.message}
            className={styles.input}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? "rental-message-error" : undefined}
          />
          <FieldError id="rental-message" error={errors.message} />
        </div>

        {/* Honeypot: invisible to people and screen readers, filled by bots. */}
        <div aria-hidden="true" className={styles.trap}>
          <label htmlFor="rental-website">No completar</label>
          <input id="rental-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>
          {pending ? "Enviando…" : "Quiero que la administren"}
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

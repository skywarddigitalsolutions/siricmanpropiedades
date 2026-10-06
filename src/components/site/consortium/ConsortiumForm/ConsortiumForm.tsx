"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { CONSORTIUM_MESSAGE_MAX, type ConsortiumField, type ConsortiumState } from "@/lib/leads/consortium-form";
import styles from "./ConsortiumForm.module.css";

type ConsortiumFormProps = {
  action: (prev: ConsortiumState, formData: FormData) => Promise<ConsortiumState>;
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
  hint,
  error,
  ...inputProps
}: {
  name: ConsortiumField;
  label: string;
  hint?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = `consortium-${name}`;
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {hint && <span className={styles.hint}> {hint}</span>}
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

/** Proposal request of the consortium administration page. */
export default function ConsortiumForm({ action }: ConsortiumFormProps) {
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
        <p className={styles.thanksTitle}>¡Recibimos tu consulta!</p>
        <p className={styles.thanksText}>
          Gabriel te contacta a la brevedad para conocer el edificio y armar la propuesta.
        </p>
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  return (
    <form key={version} action={formAction} className={styles.form}>
      {errors.general && (
        <p role="alert" className={styles.alert}>
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
        label="Dirección del edificio"
        autoComplete="street-address"
        required
        maxLength={200}
        defaultValue={values.address}
        error={errors.address}
      />
      <Field
        name="units"
        label="Cantidad aproximada de unidades"
        hint="(opcional)"
        type="number"
        inputMode="numeric"
        min={1}
        max={9999}
        step={1}
        defaultValue={values.units}
        error={errors.units}
      />
      <div className={styles.field}>
        <label htmlFor="consortium-message" className={styles.label}>
          Mensaje <span className={styles.hint}>(opcional)</span>
        </label>
        <textarea
          id="consortium-message"
          name="message"
          rows={4}
          maxLength={CONSORTIUM_MESSAGE_MAX}
          defaultValue={values.message}
          className={styles.input}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "consortium-message-error" : undefined}
        />
        <FieldError id="consortium-message" error={errors.message} />
      </div>

      {/* Honeypot: invisible to people and screen readers, filled by bots. */}
      <div aria-hidden="true" className={styles.trap}>
        <label htmlFor="consortium-website">No completar</label>
        <input id="consortium-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>
        {pending ? "Enviando…" : "Pedir propuesta"}
      </button>
      <p className={styles.privacy}>
        Usamos tus datos solo para responder tu consulta.{" "}
        <Link href="/privacidad" className={styles.privacyLink}>
          Privacidad
        </Link>
      </p>
    </form>
  );
}

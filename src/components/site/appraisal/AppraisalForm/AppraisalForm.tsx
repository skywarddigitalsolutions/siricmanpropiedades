"use client";

import { useActionState, useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import type { AppraisalField, AppraisalOperation, AppraisalState } from "@/lib/leads/appraisal-form";
import { PROPERTY_TYPES } from "@/lib/properties/enums";
import { PROPERTY_TYPE_LABELS } from "@/lib/properties/labels";
import styles from "./AppraisalForm.module.css";

type AppraisalFormProps = {
  action: (prev: AppraisalState, formData: FormData) => Promise<AppraisalState>;
};

const OPERATION_OPTIONS: { value: AppraisalOperation; label: string }[] = [
  { value: "sell", label: "Vender" },
  { value: "rent", label: "Alquilar" },
];

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
}: { name: AppraisalField; label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = `appraisal-${name}`;
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

/** Appraisal request form of the Tasaciones page (design: "Pedí tu tasación"). */
export default function AppraisalForm({ action }: AppraisalFormProps) {
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
        <p className={styles.thanksTitle}>Recibimos tu solicitud</p>
        <p className={styles.thanksText}>Te contactamos para coordinar la visita.</p>
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};
  const operation = values.operation === "rent" ? "rent" : "sell";

  return (
    <form key={version} action={formAction} className={styles.form}>
      <h2 className={styles.title}>Pedí tu tasación</h2>
      {errors.general && (
        <p role="alert" className={styles.alert}>
          {errors.general}
        </p>
      )}

      <div className={styles.field}>
        <div role="radiogroup" aria-label="Qué querés hacer" className={styles.toggle}>
          {OPERATION_OPTIONS.map((option) => (
            <label key={option.value} className={styles.toggleOption}>
              <input
                type="radio"
                name="operation"
                value={option.value}
                defaultChecked={operation === option.value}
                className={styles.toggleInput}
              />
              <span className={styles.toggleLabel}>{option.label}</span>
            </label>
          ))}
        </div>
        <FieldError id="appraisal-operation" error={errors.operation} />
      </div>

      <div className={styles.field}>
        <label htmlFor="appraisal-propertyType" className={styles.label}>
          Tipo de propiedad
        </label>
        <select
          id="appraisal-propertyType"
          name="propertyType"
          required
          className={`${styles.input} ${styles.select}`}
          defaultValue={values.propertyType ?? ""}
          aria-invalid={errors.propertyType ? true : undefined}
          aria-describedby={errors.propertyType ? "appraisal-propertyType-error" : undefined}
        >
          <option value="" disabled>
            Elegí una opción
          </option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {PROPERTY_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <FieldError id="appraisal-propertyType" error={errors.propertyType} />
      </div>

      <Field
        name="address"
        label="Dirección y barrio"
        autoComplete="street-address"
        required
        maxLength={200}
        defaultValue={values.address}
        error={errors.address}
      />

      <div className={styles.pair}>
        <Field
          name="rooms"
          label="Ambientes"
          type="number"
          inputMode="numeric"
          min={0}
          max={50}
          step={1}
          defaultValue={values.rooms}
          error={errors.rooms}
        />
        <Field
          name="area"
          label="Superficie aprox. (m²)"
          type="number"
          inputMode="numeric"
          min={0}
          max={1000000}
          step={1}
          defaultValue={values.area}
          error={errors.area}
        />
      </div>

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
        name="phone"
        label="Teléfono"
        type="tel"
        autoComplete="tel"
        required
        maxLength={30}
        defaultValue={values.phone}
        error={errors.phone}
      />

      <div className={styles.field}>
        <label htmlFor="appraisal-message" className={styles.label}>
          Comentarios (opcional)
        </label>
        <textarea
          id="appraisal-message"
          name="message"
          rows={3}
          maxLength={2000}
          defaultValue={values.message}
          className={styles.input}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "appraisal-message-error" : undefined}
        />
        <FieldError id="appraisal-message" error={errors.message} />
      </div>

      {/* Honeypot: invisible to people and screen readers, filled by bots. */}
      <div aria-hidden="true" className={styles.trap}>
        <label htmlFor="appraisal-website">No completar</label>
        <input id="appraisal-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>
        {pending ? "Enviando…" : "Solicitar tasación"}
      </button>
    </form>
  );
}

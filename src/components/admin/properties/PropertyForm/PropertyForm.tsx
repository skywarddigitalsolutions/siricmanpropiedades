"use client";

import { useActionState, useState } from "react";
import type { Neighborhood } from "@/lib/api/properties";
import {
  CURRENCIES,
  MARKETING_TAGS,
  OPERATIONS,
  PROPERTY_TYPES,
} from "@/lib/properties/enums";
import {
  MARKETING_TAG_LABELS,
  OPERATION_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/properties/labels";
import {
  DEFAULT_FORM_VALUES,
  type PropertyFormMode,
  type PropertyFormState,
  type PropertyFormValues,
} from "@/lib/properties/property-form";
import CheckboxField from "@/components/admin/forms/CheckboxField/CheckboxField";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import SelectField from "@/components/admin/forms/SelectField/SelectField";
import SubmitButton from "@/components/admin/forms/SubmitButton/SubmitButton";
import TextareaField from "@/components/admin/forms/TextareaField/TextareaField";
import TextField from "@/components/admin/forms/TextField/TextField";
import styles from "./PropertyForm.module.css";

export type { PropertyFormState };

type PropertyFormProps = {
  mode: PropertyFormMode;
  action: (
    prev: PropertyFormState,
    formData: FormData,
  ) => Promise<PropertyFormState>;
  neighborhoods: Neighborhood[];
  initialValues?: PropertyFormValues;
};

const CURRENCY_LABELS = { USD: "Dólares (USD)", ARS: "Pesos (ARS)" } as const;

function toOptions<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
) {
  return values.map((value) => ({ value, label: labels[value] }));
}

const OPERATION_OPTIONS = toOptions(OPERATIONS, OPERATION_LABELS);
const TYPE_OPTIONS = toOptions(PROPERTY_TYPES, PROPERTY_TYPE_LABELS);
const CURRENCY_OPTIONS = toOptions(CURRENCIES, CURRENCY_LABELS);
const MARKETING_TAG_OPTIONS = toOptions(MARKETING_TAGS, MARKETING_TAG_LABELS);

type BooleanKey = {
  [K in keyof PropertyFormValues]: PropertyFormValues[K] extends boolean
    ? K
    : never;
}[keyof PropertyFormValues];

const SERVICE_FIELDS: { name: BooleanKey; label: string }[] = [
  { name: "hasWater", label: "Agua corriente" },
  { name: "hasNaturalGas", label: "Gas natural" },
  { name: "hasSewer", label: "Cloacas" },
  { name: "hasElectricity", label: "Electricidad" },
  { name: "hasInternet", label: "Internet" },
];

const CONDITION_FIELDS: { name: BooleanKey; label: string }[] = [
  { name: "creditEligible", label: "Apta crédito" },
  { name: "petsAllowed", label: "Admite mascotas" },
  { name: "immediateAvailability", label: "Disponibilidad inmediata" },
];

/**
 * Create/edit form for a property (feature 6 T4). Presentational: the route
 * passes the Server Action, the neighborhoods and, in edit mode, the current
 * values. Number fields are text inputs with a numeric keyboard so the es-AR
 * formats accepted by `parsePropertyForm` ("120.000", "85,50") are allowed.
 */
export default function PropertyForm({
  mode,
  action,
  neighborhoods,
  initialValues = DEFAULT_FORM_VALUES,
}: PropertyFormProps) {
  const [state, formAction] = useActionState(action, {});

  // Remount the fields whenever the action returns, so uncontrolled inputs
  // (selects included, which ignore later `defaultValue` changes) show the
  // values the user submitted instead of the original ones.
  const [lastState, setLastState] = useState(state);
  const [version, setVersion] = useState(0);
  if (state !== lastState) {
    setLastState(state);
    setVersion((current) => current + 1);
  }

  const values = state.values ?? initialValues;
  const errors = state.fieldErrors ?? {};
  const hasFieldErrors = Object.keys(errors).some((key) => key !== "general");
  const neighborhoodOptions = neighborhoods.map((neighborhood) => ({
    value: neighborhood.id,
    label: neighborhood.name,
  }));

  return (
    <form key={version} action={formAction} className={styles.form}>
      {(errors.general || hasFieldErrors) && (
        <FormAlert>
          {errors.general ?? "Revisá los campos marcados antes de guardar."}
        </FormAlert>
      )}

      <fieldset className={styles.section}>
        <legend className={styles.legend}>Operación y tipo</legend>
        <div className={styles.grid}>
          <SelectField
            id="operation"
            name="operation"
            label="Operación"
            placeholder="Elegí una opción"
            options={OPERATION_OPTIONS}
            defaultValue={values.operation}
            error={errors.operation}
            required
          />
          <SelectField
            id="type"
            name="type"
            label="Tipo de propiedad"
            placeholder="Elegí una opción"
            options={TYPE_OPTIONS}
            defaultValue={values.type}
            error={errors.type}
            required
          />
        </div>
        <TextField
          id="title"
          name="title"
          label="Título"
          defaultValue={values.title}
          error={errors.title}
          minLength={5}
          maxLength={150}
          required
        />
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.legend}>Ubicación</legend>
        <SelectField
          id="neighborhoodId"
          name="neighborhoodId"
          label="Barrio"
          placeholder="Elegí un barrio"
          options={neighborhoodOptions}
          defaultValue={values.neighborhoodId}
          error={errors.neighborhoodId}
          required
        />
        <TextField
          id="address"
          name="address"
          label="Dirección"
          defaultValue={values.address}
          error={errors.address}
          minLength={3}
          maxLength={200}
          autoComplete="off"
          required
        />
        <CheckboxField
          id="showExactAddress"
          name="showExactAddress"
          label="Mostrar la dirección exacta en el sitio"
          hint="Si no lo marcás, el sitio muestra solo el barrio."
          defaultChecked={values.showExactAddress}
        />
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.legend}>Precio</legend>
        <div className={styles.grid}>
          <SelectField
            id="currency"
            name="currency"
            label="Moneda"
            placeholder="Elegí una moneda"
            options={CURRENCY_OPTIONS}
            defaultValue={values.currency}
            error={errors.currency}
            required
          />
          <TextField
            id="price"
            name="price"
            label="Precio"
            inputMode="decimal"
            defaultValue={values.price}
            error={errors.price}
            required
          />
          <TextField
            id="expenses"
            name="expenses"
            label="Expensas"
            inputMode="decimal"
            defaultValue={values.expenses}
            error={errors.expenses}
          />
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.legend}>Características</legend>
        <div className={styles.compactGrid}>
          <TextField
            id="rooms"
            name="rooms"
            label="Ambientes"
            inputMode="numeric"
            defaultValue={values.rooms}
            error={errors.rooms}
            required
          />
          <TextField
            id="bedrooms"
            name="bedrooms"
            label="Dormitorios"
            inputMode="numeric"
            defaultValue={values.bedrooms}
            error={errors.bedrooms}
            required
          />
          <TextField
            id="bathrooms"
            name="bathrooms"
            label="Baños"
            inputMode="numeric"
            defaultValue={values.bathrooms}
            error={errors.bathrooms}
            required
          />
          <TextField
            id="coveredArea"
            name="coveredArea"
            label="Sup. cubierta (m²)"
            inputMode="decimal"
            defaultValue={values.coveredArea}
            error={errors.coveredArea}
            required
          />
          <TextField
            id="totalArea"
            name="totalArea"
            label="Sup. total (m²)"
            inputMode="decimal"
            defaultValue={values.totalArea}
            error={errors.totalArea}
            required
          />
          <TextField
            id="age"
            name="age"
            label="Antigüedad (años)"
            inputMode="numeric"
            defaultValue={values.age}
            error={errors.age}
            required
          />
        </div>
        <CheckboxField
          id="hasGarage"
          name="hasGarage"
          label="Tiene cochera"
          defaultChecked={values.hasGarage}
        />
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.legend}>Servicios</legend>
        <div className={styles.checkGrid}>
          {SERVICE_FIELDS.map((field) => (
            <CheckboxField
              key={field.name}
              id={field.name}
              name={field.name}
              label={field.label}
              defaultChecked={values[field.name]}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.legend}>Condiciones</legend>
        <div className={styles.checkGrid}>
          {CONDITION_FIELDS.map((field) => (
            <CheckboxField
              key={field.name}
              id={field.name}
              name={field.name}
              label={field.label}
              defaultChecked={values[field.name]}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.legend}>Publicación</legend>
        <SelectField
          id="marketingTag"
          name="marketingTag"
          label="Etiqueta comercial"
          options={MARKETING_TAG_OPTIONS}
          defaultValue={values.marketingTag}
          error={errors.marketingTag}
        />
        <CheckboxField
          id="featured"
          name="featured"
          label="Destacada en la portada"
          defaultChecked={values.featured}
        />
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.legend}>Descripción</legend>
        <TextareaField
          id="description"
          name="description"
          label="Descripción"
          rows={8}
          maxLength={5000}
          defaultValue={values.description}
          error={errors.description}
        />
      </fieldset>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Guardando…">
          {mode === "create" ? "Crear propiedad" : "Guardar cambios"}
        </SubmitButton>
      </div>
    </form>
  );
}

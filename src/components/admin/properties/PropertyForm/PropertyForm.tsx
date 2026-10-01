"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  type PropertyFieldErrors,
  type PropertyFormMode,
  type PropertyFormState,
  type PropertyFormValues,
} from "@/lib/properties/property-form";
import { currencyForOperation, suggestTitle } from "@/lib/properties/suggest";
import type { FormStep } from "@/lib/properties/steps";
import AddressField from "@/components/admin/properties/AddressField/AddressField";
import CheckboxField from "@/components/admin/forms/CheckboxField/CheckboxField";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import SelectField from "@/components/admin/forms/SelectField/SelectField";
import SubmitButton from "@/components/admin/forms/SubmitButton/SubmitButton";
import TextareaField from "@/components/admin/forms/TextareaField/TextareaField";
import TextField from "@/components/admin/forms/TextField/TextField";
import { MIN_DESCRIPTION_LENGTH } from "@/lib/properties/readiness";
import styles from "./PropertyForm.module.css";

export type { PropertyFormState };

type PropertyFormProps = {
  mode: PropertyFormMode;
  /** Which step's fields this form owns: step 1 data or step 3 description and extras. */
  step: FormStep;
  action: (
    prev: PropertyFormState,
    formData: FormData,
  ) => Promise<PropertyFormState>;
  neighborhoods: Neighborhood[];
  initialValues?: PropertyFormValues;
};

const CURRENCY_LABELS = { USD: "Dólares (USD)", ARS: "Pesos (ARS)" } as const;
const DESCRIPTION_MAX = 5000;

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

type FieldsProps = {
  mode: PropertyFormMode;
  neighborhoods: Neighborhood[];
  values: PropertyFormValues;
  errors: PropertyFieldErrors;
};

/**
 * Step 1: the 13 required fields grouped as operation and type, location,
 * price, rooms and areas, plus the title. Operation, type, barrio, rooms,
 * currency and title are controlled here so that, when creating, the currency
 * follows the operation (until the user picks one) and the title is suggested
 * (until the user edits it). Lives inside the keyed `<form>`, so it remounts
 * with the submitted values after each action.
 */
function DatosFields({ mode, neighborhoods, values, errors }: FieldsProps) {
  const isCreate = mode === "create";
  const [operation, setOperation] = useState(values.operation);
  const [type, setType] = useState(values.type);
  const [currency, setCurrency] = useState(values.currency);
  const [currencyTouched, setCurrencyTouched] = useState(
    () =>
      !isCreate ||
      (values.operation !== "" &&
        values.currency !== currencyForOperation(values.operation)),
  );
  const [neighborhoodId, setNeighborhoodId] = useState(values.neighborhoodId);
  const [rooms, setRooms] = useState(values.rooms);

  const suggestionFor = (
    nextType: string,
    nextNeighborhoodId: string,
    nextRooms: string,
  ) =>
    isCreate
      ? suggestTitle({
          type: nextType,
          neighborhoodName:
            neighborhoods.find((n) => n.id === nextNeighborhoodId)?.name ?? "",
          rooms: nextRooms,
        })
      : "";
  const suggested = suggestionFor(type, neighborhoodId, rooms);
  // `null` = the user has not edited the title, so it follows the suggestion.
  const [titleOverride, setTitleOverride] = useState<string | null>(() => {
    if (!isCreate) return values.title;
    if (values.title === "") return null;
    return values.title ===
      suggestionFor(values.type, values.neighborhoodId, values.rooms)
      ? null
      : values.title;
  });
  const title = titleOverride ?? suggested;

  const neighborhoodOptions = neighborhoods.map((neighborhood) => ({
    value: neighborhood.id,
    label: neighborhood.name,
  }));

  return (
    <>
      <fieldset className={styles.section}>
        <legend className={styles.legend}>Operación y tipo</legend>
        <div className={styles.grid}>
          <SelectField
            id="operation"
            name="operation"
            label="Operación"
            placeholder="Elegí una opción"
            options={OPERATION_OPTIONS}
            value={operation}
            onChange={(event) => {
              const next = event.target.value;
              setOperation(next);
              const suggestedCurrency = currencyForOperation(next);
              if (isCreate && !currencyTouched && suggestedCurrency) {
                setCurrency(suggestedCurrency);
              }
            }}
            error={errors.operation}
            required
          />
          <SelectField
            id="type"
            name="type"
            label="Tipo de propiedad"
            placeholder="Elegí una opción"
            options={TYPE_OPTIONS}
            value={type}
            onChange={(event) => setType(event.target.value)}
            error={errors.type}
            required
          />
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.legend}>Ubicación</legend>
        <AddressField
          neighborhoods={neighborhoods}
          neighborhoodId={neighborhoodId}
          onNeighborhoodChange={setNeighborhoodId}
          defaultAddress={values.address}
          error={errors.address}
        />
        <SelectField
          id="neighborhoodId"
          name="neighborhoodId"
          label="Barrio"
          placeholder="Elegí un barrio"
          options={neighborhoodOptions}
          value={neighborhoodId}
          onChange={(event) => setNeighborhoodId(event.target.value)}
          error={errors.neighborhoodId}
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
            value={currency}
            onChange={(event) => {
              setCurrency(event.target.value);
              setCurrencyTouched(true);
            }}
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
        <legend className={styles.legend}>Ambientes y superficies</legend>
        <div className={styles.compactGrid}>
          <TextField
            id="rooms"
            name="rooms"
            label="Ambientes"
            inputMode="numeric"
            value={rooms}
            onChange={(event) => setRooms(event.target.value)}
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
        <legend className={styles.legend}>Título del aviso</legend>
        <TextField
          id="title"
          name="title"
          label="Título"
          value={title}
          onChange={(event) =>
            setTitleOverride(event.target.value === "" ? null : event.target.value)
          }
          error={errors.title}
          minLength={5}
          maxLength={150}
          required
        />
        {isCreate && titleOverride === null && title !== "" && (
          <p className={styles.hint}>
            Lo armamos con los datos que cargaste. Podés editarlo.
          </p>
        )}
      </fieldset>
    </>
  );
}

function DescriptionField({
  defaultValue,
  error,
}: {
  defaultValue: string;
  error?: string;
}) {
  const [length, setLength] = useState(defaultValue.trim().length);
  const missing = Math.max(0, MIN_DESCRIPTION_LENGTH - length);

  return (
    <div className={styles.descriptionField}>
      <TextareaField
        id="description"
        name="description"
        label="Descripción"
        rows={8}
        maxLength={DESCRIPTION_MAX}
        defaultValue={defaultValue}
        error={error}
        onChange={(event) => setLength(event.target.value.trim().length)}
      />
      <p className={styles.counter}>
        <span>
          {length} / {DESCRIPTION_MAX}
        </span>
        {missing > 0 && (
          <span className={styles.counterHint}>
            Te faltan {missing} caracteres para poder publicar.
          </span>
        )}
      </p>
    </div>
  );
}

function OptionalGroup({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={styles.optional} open={defaultOpen}>
      <summary className={styles.optionalSummary}>
        {title}
        <span className={styles.optionalTag}>Opcional</span>
      </summary>
      <div className={styles.optionalBody}>{children}</div>
    </details>
  );
}

/** Step 3: description plus optional collapsed groups (services, conditions, highlight). */
function ExtrasFields({ values, errors }: Pick<FieldsProps, "values" | "errors">) {
  return (
    <>
      <fieldset className={styles.section}>
        <legend className={styles.legend}>Descripción</legend>
        <DescriptionField
          defaultValue={values.description}
          error={errors.description}
        />
      </fieldset>

      <OptionalGroup
        title="Servicios"
        defaultOpen={SERVICE_FIELDS.some((field) => values[field.name])}
      >
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
      </OptionalGroup>

      <OptionalGroup
        title="Condiciones"
        defaultOpen={CONDITION_FIELDS.some((field) => values[field.name])}
      >
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
      </OptionalGroup>

      <OptionalGroup
        title="Destacar el aviso"
        defaultOpen={values.featured || values.marketingTag !== "none"}
      >
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
      </OptionalGroup>
    </>
  );
}

/**
 * Form of one editor step (feature 6 T4, reworked in feature 16 T3):
 * `step="datos"` owns the required data, `step="extras"` the description and
 * optional extras. Presentational: the route passes the Server Action, the
 * neighborhoods and, in edit mode, the current values. Number fields are text
 * inputs with a numeric keyboard so the es-AR formats accepted by
 * `parsePropertyForm` ("120.000", "85,50") are allowed.
 */
export default function PropertyForm({
  mode,
  step,
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

  // After a failed submit, take the user to what needs fixing: the first
  // invalid field, or the error summary when the error is not field-specific.
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (version === 0 || !state.fieldErrors) return;
    const form = formRef.current;
    const target = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (target) target.focus();
    else form?.querySelector('[role="alert"]')?.scrollIntoView({ block: "center" });
  }, [version, state.fieldErrors]);

  const values = state.values ?? initialValues;
  const errors = state.fieldErrors ?? {};
  const hasFieldErrors = Object.keys(errors).some((key) => key !== "general");

  return (
    <form
      key={version}
      ref={formRef}
      action={formAction}
      className={styles.form}
    >
      {(errors.general || hasFieldErrors) && (
        <FormAlert>
          {errors.general ?? "Revisá los campos marcados antes de guardar."}
        </FormAlert>
      )}

      {step === "datos" ? (
        <DatosFields
          mode={mode}
          neighborhoods={neighborhoods}
          values={values}
          errors={errors}
        />
      ) : (
        <ExtrasFields values={values} errors={errors} />
      )}

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Guardando…">
          {mode === "create" ? "Guardar y continuar" : "Guardar cambios"}
        </SubmitButton>
      </div>
    </form>
  );
}

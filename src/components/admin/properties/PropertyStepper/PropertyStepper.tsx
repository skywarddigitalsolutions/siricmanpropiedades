import Link from "next/link";
import { Check } from "lucide-react";
import { STEPS, stepHref, type StepId } from "@/lib/properties/steps";
import styles from "./PropertyStepper.module.css";

type PropertyStepperProps = {
  current: StepId;
  /** Absent while creating: only step 1 exists until the draft is saved. */
  propertyId?: string;
};

/**
 * Stepper of the guided editor. On phones it collapses to a progress bar
 * plus "Paso 2 de 4: Fotos" with compact numbered dots; from 720px it is a
 * horizontal stepper with labels. Editing an existing property allows free
 * navigation between steps; before the draft exists later steps are disabled.
 */
export default function PropertyStepper({
  current,
  propertyId,
}: PropertyStepperProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === current);
  const number = currentIndex + 1;

  return (
    <nav aria-label="Pasos de la propiedad" className={styles.stepper}>
      <p className={styles.compact}>
        Paso {number} de {STEPS.length}: {STEPS[currentIndex].label}
      </p>
      <div
        className={styles.bar}
        role="progressbar"
        aria-label="Progreso"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={number}
      >
        <span
          className={styles.fill}
          style={{ width: `${(number / STEPS.length) * 100}%` }}
        />
      </div>
      <ol className={styles.list}>
        {STEPS.map((step, index) => {
          const isCurrent = step.id === current;
          const done = index < currentIndex;
          const enabled = propertyId !== undefined || isCurrent;
          const content = (
            <>
              <span className={styles.dot} aria-hidden>
                {done ? <Check size={14} /> : index + 1}
              </span>
              <span className={styles.label}>{step.label}</span>
            </>
          );
          return (
            <li
              key={step.id}
              className={styles.item}
              data-current={isCurrent || undefined}
              data-done={done || undefined}
              aria-disabled={enabled ? undefined : true}
            >
              {enabled && propertyId ? (
                <Link
                  href={stepHref(propertyId, step.id)}
                  className={styles.link}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {content}
                </Link>
              ) : (
                <span className={styles.link}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

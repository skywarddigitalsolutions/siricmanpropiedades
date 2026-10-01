import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { STEPS, stepHref, type StepId } from "@/lib/properties/steps";
import styles from "./StepNav.module.css";

type StepNavProps = {
  propertyId: string;
  current: StepId;
};

/** Previous / next links at the end of a step (the stepper allows jumping anywhere too). */
export default function StepNav({ propertyId, current }: StepNavProps) {
  const index = STEPS.findIndex((step) => step.id === current);
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];

  return (
    <div className={styles.nav}>
      {previous ? (
        <Link href={stepHref(propertyId, previous.id)} className={styles.link}>
          <ArrowLeft aria-hidden size={18} />
          Anterior: {previous.label}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={stepHref(propertyId, next.id)} className={`${styles.link} ${styles.next}`}>
          Siguiente: {next.label}
          <ArrowRight aria-hidden size={18} />
        </Link>
      )}
    </div>
  );
}

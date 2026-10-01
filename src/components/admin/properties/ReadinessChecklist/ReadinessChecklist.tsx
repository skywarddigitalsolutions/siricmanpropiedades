import Link from "next/link";
import { Check, Circle } from "lucide-react";
import type { Readiness } from "@/lib/properties/readiness";
import { stepHref, type StepId } from "@/lib/properties/steps";
import styles from "./ReadinessChecklist.module.css";

const STEP_FOR_ITEM: Record<Readiness["items"][number]["id"], StepId> = {
  photos: "fotos",
  description: "descripcion",
  price: "datos",
};

type ReadinessChecklistProps = {
  readiness: Readiness;
  propertyId: string;
};

/** What is still missing before publishing, each pending item linking to the step that fixes it. */
export default function ReadinessChecklist({
  readiness,
  propertyId,
}: ReadinessChecklistProps) {
  const pending = readiness.missing.length;

  return (
    <div className={styles.box}>
      <p className={readiness.ready ? styles.ready : styles.pending}>
        {readiness.ready
          ? "Lista para publicar"
          : `Faltan ${pending} ${pending === 1 ? "requisito" : "requisitos"} para publicar`}
      </p>
      <ul className={styles.list}>
        {readiness.items.map((item) => (
          <li key={item.id} className={styles.item} data-done={item.done || undefined}>
            {item.done ? (
              <Check aria-hidden size={18} className={styles.iconDone} />
            ) : (
              <Circle aria-hidden size={18} className={styles.iconPending} />
            )}
            <span>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.state}>
                {" "}
                <span className="sr-only">{item.done ? "Listo" : "Pendiente"}</span>
              </span>
              {!item.done && (
                <>
                  <br />
                  <Link
                    href={stepHref(propertyId, STEP_FOR_ITEM[item.id])}
                    className={styles.fix}
                  >
                    {item.hint}
                  </Link>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

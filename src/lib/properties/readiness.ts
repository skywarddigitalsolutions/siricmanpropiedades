/** What a property needs before it can be published (feature 16 T3). */
export const MIN_DESCRIPTION_LENGTH = 50;

export type ReadinessItem = {
  id: "photos" | "description" | "price";
  label: string;
  done: boolean;
  /** Where to fix it, shown while the item is pending. */
  hint: string;
};

export type Readiness = {
  items: ReadinessItem[];
  ready: boolean;
  /** Labels of the pending items. */
  missing: string[];
};

export function computeReadiness(input: {
  imageCount: number;
  description: string | null;
  price: number;
}): Readiness {
  const items: ReadinessItem[] = [
    {
      id: "photos",
      label: "Al menos una foto",
      done: input.imageCount >= 1,
      hint: "Cargá fotos en el paso 2.",
    },
    {
      id: "description",
      label: `Descripción de ${MIN_DESCRIPTION_LENGTH} caracteres o más`,
      done: (input.description ?? "").trim().length >= MIN_DESCRIPTION_LENGTH,
      hint: "Escribila en el paso 3.",
    },
    {
      id: "price",
      label: "Precio cargado",
      done: input.price > 0,
      hint: "Completalo en el paso 1.",
    },
  ];
  return {
    items,
    ready: items.every((item) => item.done),
    missing: items.filter((item) => !item.done).map((item) => item.label),
  };
}

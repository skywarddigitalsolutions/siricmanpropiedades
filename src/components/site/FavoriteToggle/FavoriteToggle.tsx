"use client";

import { Heart } from "lucide-react";
import type { FavoriteInput } from "@/lib/favorites/store";
import { useFavorites } from "@/lib/favorites/use-favorites";
import styles from "./FavoriteToggle.module.css";

type FavoriteToggleProps = {
  property: FavoriteInput;
  /** `icon`: round heart over a card photo. `labeled`: pill with "Guardar" text (detail page). */
  variant?: "icon" | "labeled";
};

/**
 * Save/unsave toggle. It must never sit inside a link: on cards it is a
 * sibling positioned above the stretched title link (z-index), so clicking it
 * saves without navigating.
 */
export default function FavoriteToggle({ property, variant = "icon" }: FavoriteToggleProps) {
  const { isSaved, toggle } = useFavorites();
  const saved = isSaved(property.slug);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={`${styles.toggle} ${variant === "labeled" ? styles.labeled : styles.icon}`}
      data-saved={saved ? "" : undefined}
      onClick={(event) => {
        event.stopPropagation();
        toggle(property);
      }}
    >
      <Heart aria-hidden size={variant === "labeled" ? 18 : 20} />
      {variant === "labeled" && <span>{saved ? "Guardada" : "Guardar"}</span>}
    </button>
  );
}

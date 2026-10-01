"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicPropertyListItem } from "@/lib/public/types";
import PropertyCard from "../../PropertyCard/PropertyCard";
import styles from "./FeaturedSection.module.css";

/**
 * Scroll-snap row of cards. On phones it is a swipe carousel with the next
 * card peeking; from 900px it shows three cards and gets prev/next buttons
 * that disable at the ends.
 */
export default function FeaturedTrack({ properties }: { properties: PublicPropertyListItem[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      setCanPrev(track.scrollLeft > 1);
      setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 1);
    };
    const frame = requestAnimationFrame(update);
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const page = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <div className={styles.viewport}>
      <ul ref={trackRef} className={styles.track}>
        {properties.map((property) => (
          <li key={property.id} className={styles.slide}>
            <PropertyCard property={property} sizes="(min-width: 900px) 380px, 78vw" />
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={`${styles.arrow} ${styles.prev}`}
        aria-label="Anterior"
        disabled={!canPrev}
        onClick={() => page(-1)}
      >
        <ChevronLeft aria-hidden size={22} />
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.next}`}
        aria-label="Siguiente"
        disabled={!canNext}
        onClick={() => page(1)}
      >
        <ChevronRight aria-hidden size={22} />
      </button>
    </div>
  );
}

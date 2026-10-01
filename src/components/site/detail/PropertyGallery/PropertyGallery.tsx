"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicPropertyImage } from "@/lib/public/types";
import styles from "./PropertyGallery.module.css";

type PropertyGalleryProps = {
  images: PublicPropertyImage[];
  title: string;
  /** Badges laid over the photos (operation, tag). */
  overlay?: ReactNode;
};

/**
 * Swipeable photo gallery (CSS scroll snap) with previous/next buttons and a
 * position counter. The first photo is preloaded since it is the page's
 * largest element.
 */
export default function PropertyGallery({ images, title, overlay }: PropertyGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const total = images.length;

  function goTo(next: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    setIndex(next);
  }

  function syncIndex() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <section aria-label="Fotos de la propiedad" className={styles.gallery}>
      {total === 0 ? (
        <div className={styles.empty}>Sin fotos por el momento</div>
      ) : (
        <div ref={trackRef} className={styles.track} onScroll={syncIndex}>
          {images.map((image, position) => (
            <div key={image.url} className={styles.slide}>
              <Image
                src={image.url}
                alt={`${title}, foto ${position + 1} de ${total}`}
                fill
                sizes="(min-width: 1240px) 1240px, 100vw"
                priority={position === 0}
                className={styles.photo}
                unoptimized
              />
            </div>
          ))}
        </div>
      )}

      {overlay && <div className={styles.overlay}>{overlay}</div>}

      {total > 1 && (
        <>
          <span className={styles.counter} aria-live="polite">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            aria-label="Foto anterior"
            className={`${styles.nav} ${styles.prev}`}
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            <ChevronLeft aria-hidden size={20} />
          </button>
          <button
            type="button"
            aria-label="Foto siguiente"
            className={`${styles.nav} ${styles.next}`}
            disabled={index === total - 1}
            onClick={() => goTo(index + 1)}
          >
            <ChevronRight aria-hidden size={20} />
          </button>
        </>
      )}
    </section>
  );
}

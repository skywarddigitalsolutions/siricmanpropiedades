"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { PublicPropertyImage } from "@/lib/public/types";
import PropertyLightbox from "./PropertyLightbox";
import styles from "./PropertyGallery.module.css";

type PropertyGalleryProps = {
  images: PublicPropertyImage[];
  title: string;
  /** Badges laid over the photos (operation, tag). */
  overlay?: ReactNode;
};

/**
 * Swipeable photo gallery (CSS scroll snap) with previous/next buttons and a
 * position counter; any photo, or "Ver fotos", opens the full-screen
 * lightbox. The first photo is preloaded since it is the page's largest
 * element.
 */
export default function PropertyGallery({ images, title, overlay }: PropertyGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
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

  function openLightbox(at: number) {
    setLightboxIndex(at);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
    // Leave the inline gallery on the photo the visitor ended on.
    const track = trackRef.current;
    if (track && track.clientWidth > 0) {
      track.scrollTo({ left: lightboxIndex * track.clientWidth, behavior: "instant" });
    }
    setIndex(lightboxIndex);
  }

  return (
    <section aria-label="Fotos de la propiedad" className={styles.gallery}>
      {total === 0 ? (
        <div className={styles.empty}>Sin fotos por el momento</div>
      ) : (
        <div ref={trackRef} className={styles.track} onScroll={syncIndex}>
          {images.map((image, position) => (
            <button
              key={image.url}
              type="button"
              aria-label={`Ampliar foto ${position + 1} de ${total}`}
              className={styles.slide}
              onClick={() => openLightbox(position)}
            >
              <Image
                src={image.url}
                alt={`${title}, foto ${position + 1} de ${total}`}
                fill
                sizes="(min-width: 1240px) 1240px, 100vw"
                priority={position === 0}
                className={styles.photo}
                unoptimized
              />
            </button>
          ))}
        </div>
      )}

      {overlay && <div className={styles.overlay}>{overlay}</div>}

      {total > 0 && (
        <button
          type="button"
          className={styles.viewAll}
          onClick={() => openLightbox(index)}
        >
          <Expand aria-hidden size={16} />
          Ver fotos ({total})
        </button>
      )}

      {total > 1 && (
        <>
          <span className={styles.counter}>
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

      <PropertyLightbox
        images={images}
        title={title}
        open={lightboxOpen}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={closeLightbox}
      />
    </section>
  );
}

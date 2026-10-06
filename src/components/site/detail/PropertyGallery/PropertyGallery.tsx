"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
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

/** How long "Ver fotos" stays on screen after the page opens. */
const HINT_DURATION_MS = 3000;

/** Desktop mosaic tiles for a photo count: 1, 2, a big one plus 2, or a big one plus 4. */
function mosaicSize(total: number): number {
  if (total >= 5) return 5;
  if (total >= 3) return 3;
  return total;
}

/**
 * Swipeable photo gallery (CSS scroll snap) with previous/next buttons and a
 * position counter; any photo, or "Ver fotos", opens the full-screen
 * lightbox. "Ver fotos" is a hint: it fades out after a few seconds, or as
 * soon as the visitor touches or scrolls the page, so the photo stays clean;
 * it comes back when it receives keyboard focus. On desktop a photo mosaic
 * replaces the carousel (both are rendered; CSS shows one). The first photo
 * is preloaded since it is the page's largest element.
 */
export default function PropertyGallery({ images, title, overlay }: PropertyGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);
  const total = images.length;
  const tiles = mosaicSize(total);

  useEffect(() => {
    if (!hintVisible) return;
    const hide = () => setHintVisible(false);
    // Any touch outside the hint itself, or any scroll (page or photo swipe,
    // caught in the capture phase), means the visitor has found their way.
    const hideOnPointer = (event: PointerEvent) => {
      if (!hintRef.current?.contains(event.target as Node)) hide();
    };
    const timer = setTimeout(hide, HINT_DURATION_MS);
    window.addEventListener("pointerdown", hideOnPointer);
    window.addEventListener("scroll", hide, { capture: true, passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", hideOnPointer);
      window.removeEventListener("scroll", hide, { capture: true });
    };
  }, [hintVisible]);

  function goTo(next: number) {
    const track = trackRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: next * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
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
        <div
          ref={trackRef}
          role="group"
          aria-label="Carrusel de fotos"
          className={styles.track}
          onScroll={syncIndex}
        >
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

      {total > 0 && (
        // Desktop only (CSS): the phone carousel above stays for small screens.
        <div
          role="group"
          aria-label="Fotos destacadas"
          className={styles.mosaic}
          data-size={tiles}
        >
          {images.slice(0, tiles).map((image, position) => {
            const hidden = total - tiles;
            const isMore = hidden > 0 && position === tiles - 1;
            return (
              <button
                key={image.url}
                type="button"
                aria-label={isMore ? `Ver las ${total} fotos` : `Ampliar foto ${position + 1} de ${total}`}
                className={styles.tile}
                onClick={() => openLightbox(position)}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes={position === 0 ? "(min-width: 1240px) 620px, 50vw" : "(min-width: 1240px) 310px, 25vw"}
                  className={styles.photo}
                  unoptimized
                />
                {isMore && (
                  <span aria-hidden className={styles.more}>
                    +{hidden} {hidden === 1 ? "foto" : "fotos"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {overlay && <div className={styles.overlay}>{overlay}</div>}

      {total > 0 && (
        <button
          type="button"
          ref={hintRef}
          className={styles.viewAll}
          data-hidden={hintVisible ? undefined : ""}
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

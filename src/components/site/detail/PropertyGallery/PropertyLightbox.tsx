"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PublicPropertyImage } from "@/lib/public/types";
import styles from "./PropertyLightbox.module.css";

type PropertyLightboxProps = {
  images: PublicPropertyImage[];
  title: string;
  open: boolean;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

/** Horizontal distance (px) a pointer must travel to count as a swipe. */
const SWIPE_DISTANCE = 50;

/**
 * Full-screen photo viewer on a native modal `<dialog>` (focus trap, inert
 * page, focus returns to the opener on close). Swipe, arrow keys, buttons and
 * a thumbnail strip on wide screens move between photos.
 */
export default function PropertyLightbox({
  images,
  title,
  open,
  index,
  onIndexChange,
  onClose,
}: PropertyLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  // Screen readers hear the position only after the visitor moves, not on open.
  const [announced, setAnnounced] = useState(false);
  const total = images.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setAnnounced(false);
      // showModal gives the focus trap and backdrop; fall back to `open` where unsupported.
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Warm the cache for the neighbours so arrows and swipes feel instant.
  useEffect(() => {
    if (!open) return;
    for (const neighbour of [images[index - 1], images[index + 1]]) {
      if (neighbour) new window.Image().src = neighbour.url;
    }
  }, [open, index, images]);

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= total) return;
      setAnnounced(true);
      onIndexChange(next);
    },
    [total, onIndexChange],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    swipeStart.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? index + 1 : index - 1);
  }

  if (total === 0) return null;
  const current = images[index] ?? images[0];

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Galería de fotos"
      onKeyDown={handleKeyDown}
      onClose={onClose}
    >
      {open && (
        <>
          <div className={styles.header}>
            <span className={styles.counter}>
              {index + 1} / {total}
            </span>
            <button type="button" aria-label="Cerrar" className={styles.close} onClick={onClose}>
              <X aria-hidden size={22} />
            </button>
          </div>

          <div
            data-testid="lightbox-stage"
            className={styles.stage}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
              swipeStart.current = null;
            }}
          >
            <Image
              key={current.url}
              src={current.url}
              alt={`${title}, foto ${index + 1} de ${total}`}
              fill
              sizes="100vw"
              className={styles.photo}
              draggable={false}
              unoptimized
            />
          </div>

          {total > 1 && (
            <>
              <button
                type="button"
                aria-label="Foto anterior"
                className={`${styles.nav} ${styles.prev}`}
                disabled={index === 0}
                onClick={() => go(index - 1)}
              >
                <ChevronLeft aria-hidden size={26} />
              </button>
              <button
                type="button"
                aria-label="Foto siguiente"
                className={`${styles.nav} ${styles.next}`}
                disabled={index === total - 1}
                onClick={() => go(index + 1)}
              >
                <ChevronRight aria-hidden size={26} />
              </button>
            </>
          )}

          <p role="status" className="sr-only">
            {announced ? `Foto ${index + 1} de ${total}` : ""}
          </p>

          {total > 1 && (
            <ul className={styles.thumbs} aria-label="Miniaturas">
              {images.map((image, position) => (
                <li key={image.url}>
                  <button
                    type="button"
                    aria-label={`Ir a la foto ${position + 1}`}
                    aria-current={position === index ? "true" : undefined}
                    className={styles.thumb}
                    onClick={() => go(position)}
                  >
                    <Image
                      src={image.thumbnailUrl}
                      alt=""
                      width={96}
                      height={72}
                      className={styles.thumbImage}
                      unoptimized
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </dialog>
  );
}

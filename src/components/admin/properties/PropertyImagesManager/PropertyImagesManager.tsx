"use client";

import Image from "next/image";
import { useState, useTransition, type ChangeEvent } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Star, Trash2 } from "lucide-react";
import type { PropertyImage } from "@/lib/api/properties";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES_PER_PROPERTY,
  moveItem,
  moveToFront,
  validateImageFile,
} from "@/lib/properties/images";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import styles from "./PropertyImagesManager.module.css";

type PropertyImagesManagerProps = {
  images: PropertyImage[];
  uploadAction: (formData: FormData) => Promise<ActionFeedback>;
  reorderAction: (imageIds: string[]) => Promise<ActionFeedback>;
  deleteAction: (imageId: string) => Promise<ActionFeedback>;
};

/**
 * Photos block of the property editor (feature 6 T6): upload (one request per
 * file, so each stays under the 15 MB limit), reorder with buttons (works on
 * touch and keyboard), set cover (= first photo) and delete with confirmation.
 * Reorders are shown immediately and rolled back if saving fails.
 */
export default function PropertyImagesManager({
  images,
  uploadAction,
  reorderAction,
  deleteAction,
}: PropertyImagesManagerProps) {
  const [order, setOrder] = useState(images);
  // Every action revalidates the page; adopt the fresh server list without
  // remounting, so an upload batch in progress keeps its status and errors.
  const [syncedImages, setSyncedImages] = useState(images);
  if (images !== syncedImages) {
    setSyncedImages(images);
    setOrder(images);
  }

  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const remaining = MAX_IMAGES_PER_PROPERTY - order.length;
  const uploadDisabled = remaining <= 0 || isPending;

  function saveOrder(next: PropertyImage[]) {
    const previous = order;
    setOrder(next);
    setErrors([]);
    startTransition(async () => {
      const result = await reorderAction(next.map((item) => item.id));
      if (result.error) {
        setOrder(previous);
        setErrors([result.error]);
      }
    });
  }

  function remove(imageId: string) {
    setConfirmingId(null);
    setErrors([]);
    startTransition(async () => {
      const result = await deleteAction(imageId);
      if (result.error) setErrors([result.error]);
    });
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    const problems: string[] = [];
    let valid: File[] = [];
    for (const file of files) {
      const problem = validateImageFile(file);
      if (problem) problems.push(`${file.name}: ${problem}`);
      else valid.push(file);
    }
    if (valid.length > remaining) {
      problems.push(
        `Solo se pueden agregar ${remaining} fotos más; se omitieron ${valid.length - remaining}.`,
      );
      valid = valid.slice(0, remaining);
    }

    setErrors(problems);
    if (valid.length === 0) return;

    startTransition(async () => {
      for (const [index, file] of valid.entries()) {
        setProgress(`Subiendo ${index + 1} de ${valid.length}…`);
        const formData = new FormData();
        formData.set("file", file);
        const result = await uploadAction(formData);
        if (result.error) problems.push(`${file.name}: ${result.error}`);
      }
      setProgress(null);
      setErrors([...problems]);
    });
  }

  return (
    <div className={styles.manager}>
      <div className={styles.toolbar}>
        <label
          className={styles.upload}
          data-disabled={uploadDisabled || undefined}
        >
          <ImagePlus aria-hidden size={20} />
          <span>Agregar fotos</span>
          <input
            type="file"
            className={styles.fileInput}
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            disabled={uploadDisabled}
            onChange={upload}
          />
        </label>
        <p className={styles.meta}>
          {order.length} de {MAX_IMAGES_PER_PROPERTY} fotos
        </p>
      </div>
      <p className={styles.hint}>
        JPG, PNG o WebP de hasta 15 MB cada una. La primera foto es la portada.
      </p>

      <p className={styles.progress} role="status" aria-live="polite">
        {progress}
      </p>
      {errors.length > 0 && (
        <FormAlert>
          {errors.map((error) => (
            <span key={error} className={styles.errorLine}>
              {error}
            </span>
          ))}
        </FormAlert>
      )}

      {order.length === 0 ? (
        <p className={styles.empty}>
          Todavía no hay fotos. Las propiedades con buenas fotos reciben muchas
          más consultas.
        </p>
      ) : (
        <ol className={styles.grid} aria-busy={isPending}>
          {order.map((item, index) => {
            const number = index + 1;
            const isCover = index === 0;
            return (
              <li key={item.id} className={styles.tile}>
                <div className={styles.frame}>
                  <Image
                    src={item.thumbnailUrl}
                    alt={isCover ? `Foto ${number} (portada)` : `Foto ${number}`}
                    width={item.thumbnailWidth}
                    height={item.thumbnailHeight}
                    className={styles.photo}
                    unoptimized
                  />
                  {isCover && <span className={styles.coverBadge}>Portada</span>}
                </div>

                {confirmingId === item.id ? (
                  <div className={styles.confirm}>
                    <button
                      type="button"
                      className={styles.confirmDelete}
                      aria-label={`Confirmar eliminación de la foto ${number}`}
                      onClick={() => remove(item.id)}
                    >
                      Eliminar
                    </button>
                    <button
                      type="button"
                      className={styles.cancel}
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className={styles.controls}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label={`Mover la foto ${number} antes`}
                      disabled={isCover || isPending}
                      onClick={() => saveOrder(moveItem(order, index, -1))}
                    >
                      <ChevronLeft aria-hidden size={20} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label={`Mover la foto ${number} después`}
                      disabled={index === order.length - 1 || isPending}
                      onClick={() => saveOrder(moveItem(order, index, 1))}
                    >
                      <ChevronRight aria-hidden size={20} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label={`Usar la foto ${number} como portada`}
                      disabled={isCover || isPending}
                      onClick={() => saveOrder(moveToFront(order, index))}
                    >
                      <Star aria-hidden size={18} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.deleteButton}`}
                      aria-label={`Eliminar la foto ${number}`}
                      disabled={isPending}
                      onClick={() => setConfirmingId(item.id)}
                    >
                      <Trash2 aria-hidden size={18} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

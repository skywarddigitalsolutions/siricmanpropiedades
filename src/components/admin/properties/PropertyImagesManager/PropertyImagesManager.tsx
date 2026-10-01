"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImagePlus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { PropertyImage } from "@/lib/api/properties";
import { compressImage } from "@/lib/properties/image-compression";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES_PER_PROPERTY,
  moveItem,
  moveToFront,
  reorderByIds,
  validateImageFile,
  validatePickedImage,
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

type UploadItem = {
  key: number;
  name: string;
  previewUrl: string | null;
  status: "waiting" | "compressing" | "uploading" | "error";
  error?: string;
};

const STATUS_LABELS: Record<Exclude<UploadItem["status"], "error">, string> = {
  waiting: "En espera…",
  compressing: "Optimizando…",
  uploading: "Subiendo…",
};

const DND_ANNOUNCEMENTS = {
  onDragStart: ({ active }: { active: { id: string | number } }) =>
    `Levantaste la foto ${active.id}.`,
  onDragOver: () => undefined,
  onDragEnd: () => "Soltaste la foto.",
  onDragCancel: () => "Cancelaste el movimiento.",
};

const DND_INSTRUCTIONS = {
  draggable:
    "Para mover la foto, presioná espacio, usá las flechas para elegir el lugar y presioná espacio de nuevo para soltarla.",
};

type SortablePhotoProps = {
  item: PropertyImage;
  number: number;
  total: number;
  isCover: boolean;
  isPending: boolean;
  confirming: boolean;
  onMove: (delta: -1 | 1) => void;
  onMakeCover: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

/** One photo tile: sortable by drag (handle) and by buttons (touch and keyboard). */
function SortablePhoto({
  item,
  number,
  total,
  isCover,
  isPending,
  confirming,
  onMove,
  onMakeCover,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: SortablePhotoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isPending });

  return (
    <li
      ref={setNodeRef}
      className={styles.tile}
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
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
        <button
          type="button"
          ref={setActivatorNodeRef}
          className={styles.handle}
          aria-label={`Arrastrar la foto ${number}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden size={18} />
        </button>
      </div>

      {confirming ? (
        <div className={styles.confirm}>
          <button
            type="button"
            className={styles.confirmDelete}
            aria-label={`Confirmar eliminación de la foto ${number}`}
            onClick={onConfirmDelete}
          >
            Eliminar
          </button>
          <button type="button" className={styles.cancel} onClick={onCancelDelete}>
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
            onClick={() => onMove(-1)}
          >
            <ChevronLeft aria-hidden size={20} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={`Mover la foto ${number} después`}
            disabled={number === total || isPending}
            onClick={() => onMove(1)}
          >
            <ChevronRight aria-hidden size={20} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={`Usar la foto ${number} como portada`}
            disabled={isCover || isPending}
            onClick={onMakeCover}
          >
            <Star aria-hidden size={18} />
          </button>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.deleteButton}`}
            aria-label={`Eliminar la foto ${number}`}
            disabled={isPending}
            onClick={onAskDelete}
          >
            <Trash2 aria-hidden size={18} />
          </button>
        </div>
      )}
    </li>
  );
}

/**
 * Photos step of the property editor (feature 6 T6, reworked in feature 16
 * T4): grid with previews and a "Portada" badge on the first photo, reorder
 * by dragging the handle (pointer or keyboard, via dnd-kit) or with the
 * buttons (touch), two-step delete, and uploads that show a thumbnail and a
 * status per file. Each photo is compressed in the browser (max 2560px,
 * WebP/JPEG ~0.85) and sent in its own request, so every request stays well
 * under the 15 MB limit. Reorders are shown immediately and rolled back if
 * saving fails.
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
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isSaving, startTransition] = useTransition();
  // Not a transition: React holds state updates made before the first `await` of an
  // async transition until it finishes, and the per-file status must show right away.
  const [isUploading, setIsUploading] = useState(false);
  const isPending = isSaving || isUploading;
  const nextKey = useRef(0);

  // Release every preview URL still alive when the editor unmounts.
  const uploadsRef = useRef(uploads);
  useEffect(() => {
    uploadsRef.current = uploads;
  });
  useEffect(
    () => () => {
      for (const item of uploadsRef.current) revokePreview(item.previewUrl);
    },
    [],
  );

  const sensors = useSensors(
    // A small distance keeps taps on the handle from starting a drag by accident.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const remaining = MAX_IMAGES_PER_PROPERTY - order.length - uploads.length;
  const uploadDisabled = remaining <= 0;

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

  function onDragEnd(event: DragEndEvent) {
    if (isPending) return;
    const next = reorderByIds(
      order,
      String(event.active.id),
      event.over ? String(event.over.id) : null,
    );
    if (next !== order) saveOrder(next);
  }

  function remove(imageId: string) {
    setConfirmingId(null);
    setErrors([]);
    startTransition(async () => {
      const result = await deleteAction(imageId);
      if (result.error) setErrors([result.error]);
    });
  }

  function patchUpload(key: number, patch: Partial<UploadItem>) {
    setUploads((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function dropUpload(key: number) {
    setUploads((current) => {
      const item = current.find((entry) => entry.key === key);
      if (item) revokePreview(item.previewUrl);
      return current.filter((entry) => entry.key !== key);
    });
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    const problems: string[] = [];
    let valid: File[] = [];
    for (const file of files) {
      const problem = validatePickedImage(file);
      if (problem) problems.push(`${file.name}: ${problem}`);
      else valid.push(file);
    }
    if (valid.length > remaining) {
      problems.push(
        `Solo se pueden agregar ${Math.max(0, remaining)} fotos más; se omitieron ${valid.length - Math.max(0, remaining)}.`,
      );
      valid = valid.slice(0, Math.max(0, remaining));
    }

    setErrors(problems);
    if (valid.length === 0) return;

    const queue = valid.map((file) => ({
      file,
      key: nextKey.current++,
      previewUrl: createPreview(file),
    }));
    setUploads((current) => [
      ...current,
      ...queue.map(({ file, key, previewUrl }) => ({
        key,
        name: file.name,
        previewUrl,
        status: "waiting" as const,
      })),
    ]);

    void (async () => {
      setIsUploading(true);
      for (const [index, { file, key }] of queue.entries()) {
        setProgress(`Subiendo ${index + 1} de ${queue.length}…`);
        patchUpload(key, { status: "compressing" });
        const toSend = await compressImage(file);
        const tooBig = validateImageFile(toSend);
        if (tooBig) {
          patchUpload(key, { status: "error", error: tooBig });
          continue;
        }
        patchUpload(key, { status: "uploading" });
        const formData = new FormData();
        formData.set("file", toSend);
        try {
          const result = await uploadAction(formData);
          if (result.error) patchUpload(key, { status: "error", error: result.error });
          else dropUpload(key);
        } catch {
          // A dropped connection or an oversized request rejects instead of returning feedback.
          patchUpload(key, {
            status: "error",
            error: "No se pudo subir la foto. Revisá tu conexión y probá de nuevo.",
          });
        }
      }
      setProgress(null);
      setIsUploading(false);
    })();
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
        JPG, PNG o WebP. Las optimizamos antes de subirlas. La primera foto es la
        portada: arrastrá el ícono ⠿ o usá las flechas para ordenarlas.
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

      {order.length === 0 && uploads.length === 0 ? (
        <p className={styles.empty}>
          Todavía no hay fotos. Las propiedades con buenas fotos reciben muchas
          más consultas.
        </p>
      ) : (
        <DndContext
          id="property-photos"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={{
            announcements: DND_ANNOUNCEMENTS,
            screenReaderInstructions: DND_INSTRUCTIONS,
          }}
        >
          <SortableContext
            items={order.map((item) => item.id)}
            strategy={rectSortingStrategy}
          >
            <ol className={styles.grid} aria-busy={isPending}>
              {order.map((item, index) => (
                <SortablePhoto
                  key={item.id}
                  item={item}
                  number={index + 1}
                  total={order.length}
                  isCover={index === 0}
                  isPending={isPending}
                  confirming={confirmingId === item.id}
                  onMove={(delta) => saveOrder(moveItem(order, index, delta))}
                  onMakeCover={() => saveOrder(moveToFront(order, index))}
                  onAskDelete={() => setConfirmingId(item.id)}
                  onCancelDelete={() => setConfirmingId(null)}
                  onConfirmDelete={() => remove(item.id)}
                />
              ))}
              {uploads.map((item) => (
                <li key={`upload-${item.key}`} className={styles.tile}>
                  <div className={styles.frame} data-state={item.status}>
                    {item.previewUrl && (
                      // A blob: preview of the local file; next/image cannot optimize it.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.previewUrl}
                        alt={`Vista previa de ${item.name}`}
                        className={styles.photo}
                      />
                    )}
                  </div>
                  <div className={styles.uploadInfo}>
                    {item.status === "error" ? (
                      <>
                        <span className={styles.uploadError}>
                          {item.name}: {item.error}
                        </span>
                        <button
                          type="button"
                          className={styles.cancel}
                          aria-label={`Descartar ${item.name}`}
                          onClick={() => dropUpload(item.key)}
                        >
                          <X aria-hidden size={16} /> Descartar
                        </button>
                      </>
                    ) : (
                      <span className={styles.uploadStatus}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function createPreview(file: File): string | null {
  return typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
    ? URL.createObjectURL(file)
    : null;
}

function revokePreview(url: string | null) {
  if (url && typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(url);
}

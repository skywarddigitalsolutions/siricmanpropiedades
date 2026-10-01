import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { FavoriteSnapshot } from "@/lib/favorites/store";
import {
  favoriteView,
  similarHref,
  type FavoriteProperty,
  type FavoriteRefresh,
} from "@/lib/favorites/view";
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS, formatPrice } from "@/lib/properties/labels";
import styles from "./FavoriteCard.module.css";

type FavoriteCardProps = {
  snapshot: FavoriteSnapshot;
  refresh: FavoriteRefresh | undefined;
  onRemove: () => void;
};

/** One saved property: live data when we have it, the saved snapshot otherwise. */
export default function FavoriteCard({ snapshot, refresh, onRemove }: FavoriteCardProps) {
  const view = favoriteView(snapshot, refresh);
  const live: FavoriteProperty | undefined = refresh?.status === "ok" ? refresh.property : undefined;

  const title = live?.title ?? snapshot.title;
  const operation = live?.operation ?? snapshot.operation;
  const price = formatPrice(live?.currency ?? snapshot.currency, live?.price ?? snapshot.price);
  const priceLabel = operation === "rent" ? `${price} /mes` : price;
  const cover = live?.coverImage ?? snapshot.cover;
  const barrio = live?.neighborhood.name ?? snapshot.neighborhood;
  const titleId = `favorite-${snapshot.slug}`;
  const gone = view.state === "gone";

  return (
    <li className={styles.item}>
      <article className={styles.card} data-state={view.state}>
        <div className={styles.media}>
          {cover ? (
            <Image src={cover} alt="" fill sizes="(min-width: 960px) 360px, (min-width: 640px) 50vw, 100vw" className={styles.photo} unoptimized />
          ) : (
            <span className={styles.noPhoto}>Sin fotos</span>
          )}
          <span className={styles.badge}>{OPERATION_LABELS[operation]}</span>
        </div>

        {view.state === "closed" || (view.state === "available" && view.statusLabel) ? (
          <p className={styles.status} data-tone={view.state === "closed" ? "closed" : "reserved"}>
            {view.statusLabel}
          </p>
        ) : null}

        <div className={styles.body}>
          {gone ? (
            <p className={styles.goneMessage}>Esta propiedad ya no está disponible</p>
          ) : (
            <div className={styles.priceRow}>
              <span className={styles.price}>{priceLabel}</span>
              {view.state !== "loading" && "priceNote" in view && view.priceNote && (
                <span className={styles.priceNote}>{view.priceNote}</span>
              )}
            </div>
          )}

          <h2 id={titleId} className={styles.title}>
            {gone ? (
              title
            ) : (
              <Link href={`/propiedades/${snapshot.slug}`} className={styles.link}>
                {title}
              </Link>
            )}
          </h2>

          <span className={styles.location}>
            <MapPin aria-hidden size={14} className={styles.pin} />
            {live ? `${PROPERTY_TYPE_LABELS[live.type]} · ${barrio}` : barrio}
          </span>

          <div className={styles.actions}>
            {live && view.state === "closed" && (
              <Link href={similarHref(live)} className={styles.similar}>
                Ver similares
              </Link>
            )}
            <button
              type="button"
              className={styles.remove}
              aria-describedby={titleId}
              onClick={onRemove}
            >
              Quitar
            </button>
          </div>
        </div>
      </article>
    </li>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites/use-favorites";
import type { FavoriteRefresh } from "@/lib/favorites/view";
import FavoriteCard from "../FavoriteCard/FavoriteCard";
import styles from "./FavoritesList.module.css";

const SKELETONS = 3;

function Skeleton() {
  return <li aria-hidden className={styles.skeleton} />;
}

/**
 * The visitor's saved properties. The list itself comes from the browser
 * store; live data (sold, gone, price) is refreshed once per slug through the
 * same-origin route handler.
 */
export default function FavoritesList() {
  const { favorites, mounted, remove } = useFavorites();
  const [results, setResults] = useState<Record<string, FavoriteRefresh>>({});
  const requested = useRef(new Set<string>());

  useEffect(() => {
    if (!mounted) return;
    const missing = favorites.map((item) => item.slug).filter((slug) => !requested.current.has(slug));
    if (missing.length === 0) return;
    missing.forEach((slug) => requested.current.add(slug));

    const failed = () =>
      Object.fromEntries(
        missing.map((slug): [string, FavoriteRefresh] => [slug, { slug, status: "error" }]),
      );

    fetch(`/api/favoritos?slugs=${encodeURIComponent(missing.join(","))}`, {
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) return failed();
        const body = (await response.json()) as FavoriteRefresh[];
        const found = Object.fromEntries(body.map((item) => [item.slug, item]));
        return { ...failed(), ...found };
      })
      .catch(failed)
      .then((update) => setResults((current) => ({ ...current, ...update })));
  }, [favorites, mounted]);

  if (!mounted) {
    return (
      <div role="status" aria-label="Cargando favoritos">
        <ul className={styles.grid}>
          {Array.from({ length: SKELETONS }, (_, index) => (
            <Skeleton key={index} />
          ))}
        </ul>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>
          <Heart aria-hidden size={28} />
        </span>
        <h2 className={styles.emptyTitle}>Todavía no guardaste propiedades</h2>
        <p className={styles.emptyText}>
          Tocá el corazón en cualquier propiedad para tenerla a mano y volver a verla cuando quieras.
        </p>
        <Link href="/propiedades" className={styles.emptyCta}>
          Ver propiedades
        </Link>
      </div>
    );
  }

  const pending = favorites.filter((item) => !(item.slug in results));
  if (pending.length === favorites.length) {
    return (
      <div role="status" aria-label="Cargando favoritos">
        <ul className={styles.grid}>
          {favorites.slice(0, 6).map((item) => (
            <Skeleton key={item.slug} />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <ul className={styles.grid}>
      {favorites.map((item) =>
        item.slug in results ? (
          <FavoriteCard
            key={item.slug}
            snapshot={item}
            refresh={results[item.slug]}
            onRemove={() => remove(item.slug)}
          />
        ) : (
          <Skeleton key={item.slug} />
        ),
      )}
    </ul>
  );
}

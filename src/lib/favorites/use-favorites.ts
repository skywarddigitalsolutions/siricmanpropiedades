"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  addFavorite,
  getServerFavorites,
  readFavorites,
  removeFavorite,
  subscribeFavorites,
  toggleFavorite,
  type FavoriteInput,
} from "./store";

const subscribeNothing = () => () => {};

/**
 * Favorites for client components. `mounted` is false on the server and during
 * hydration, so UI that depends on the saved list can wait for it and never
 * mismatch the server HTML.
 */
export function useFavorites() {
  const favorites = useSyncExternalStore(subscribeFavorites, readFavorites, getServerFavorites);
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  return {
    favorites,
    count: favorites.length,
    mounted,
    isSaved: useCallback(
      (slug: string) => favorites.some((item) => item.slug === slug),
      [favorites],
    ),
    toggle: useCallback((input: FavoriteInput) => toggleFavorite(input), []),
    add: useCallback((input: FavoriteInput) => addFavorite(input), []),
    remove: useCallback((slug: string) => removeFavorite(slug), []),
  };
}

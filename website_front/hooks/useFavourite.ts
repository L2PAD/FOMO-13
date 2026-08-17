import { useState, useEffect, useMemo } from "react";
import { IProject } from "../types/global_types";

type UseFavoritesHook<T extends { _id: string }> = {
  toggleFavorite: (project: IProject) => void;
  favorites: IProject[];
};

export function useFavorites<T extends { _id: string }>(
  key: string,
  forcedFavorites: IProject[] = []
): UseFavoritesHook<T> {
  const [favorites, setFavorites] = useState<Array<IProject>>([]);

  useEffect(() => {
    const storedFavorites = localStorage.getItem(key);
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch (e) {
        console.error("Failed to parse localStorage data", e);
      }
    }
  }, [key]);

  const toggleFavorite = (project: IProject) => {
    const isFavorite = favorites.some((item) => item._id === project._id);

    const updatedFavorites = isFavorite
      ? favorites.filter((item) => item._id !== project._id)
      : [...favorites, project];

    setFavorites(updatedFavorites);
    localStorage.setItem(key, JSON.stringify(updatedFavorites));
  };

  const mergedFavorites = useMemo(() => {
    const forcedFavoriteIds = new Set(
      forcedFavorites.map((item) => String(item._id))
    );

    return [
      ...forcedFavorites,
      ...favorites.filter((item) => !forcedFavoriteIds.has(String(item._id))),
    ];
  }, [favorites, forcedFavorites]);

  return { toggleFavorite, favorites: mergedFavorites };
}

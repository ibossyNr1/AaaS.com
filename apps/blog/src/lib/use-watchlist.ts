"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "aaas-watchlist";
const CHANGE_EVENT = "watchlist-change";

export interface WatchlistItem {
  type: string;
  slug: string;
  name: string;
  addedAt: string;
}

function readStorage(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: WatchlistItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);

  // Sync from localStorage on mount and on custom event
  useEffect(() => {
    setItems(readStorage());

    const handler = () => setItems(readStorage());
    window.addEventListener(CHANGE_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const isWatched = useCallback(
    (type: string, slug: string) => items.some((i) => i.type === type && i.slug === slug),
    [items],
  );

  const toggle = useCallback(
    (type: string, slug: string, name: string) => {
      const current = readStorage();
      const exists = current.some((i) => i.type === type && i.slug === slug);
      const next = exists
        ? current.filter((i) => !(i.type === type && i.slug === slug))
        : [...current, { type, slug, name, addedAt: new Date().toISOString() }];
      writeStorage(next);
      setItems(next);
    },
    [],
  );

  const remove = useCallback((type: string, slug: string) => {
    const next = readStorage().filter((i) => !(i.type === type && i.slug === slug));
    writeStorage(next);
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    writeStorage([]);
    setItems([]);
  }, []);

  return { items, isWatched, toggle, remove, clear, count: items.length };
}

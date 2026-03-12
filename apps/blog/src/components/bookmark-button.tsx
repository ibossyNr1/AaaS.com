"use client";

import { useState, useEffect } from "react";
import { cn } from "@aaas/ui";
import { useAuth } from "@/components/auth-provider";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BookmarkButtonProps {
  type: string;
  slug: string;
  className?: string;
}

export function BookmarkButton({ type, slug, className }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  const bookmarkId = `${type}:${slug}`;

  useEffect(() => {
    if (!user) {
      setBookmarked(false);
      return;
    }

    const ref = doc(db, "bookmarks", user.uid, "items", bookmarkId);
    getDoc(ref).then((snap) => {
      if (snap.exists()) setBookmarked(true);
    }).catch(() => {});
  }, [user, bookmarkId]);

  async function toggle() {
    if (!user || loading) return;
    setLoading(true);

    const ref = doc(db, "bookmarks", user.uid, "items", bookmarkId);

    try {
      if (bookmarked) {
        await deleteDoc(ref);
        setBookmarked(false);
      } else {
        await setDoc(ref, {
          type,
          slug,
          createdAt: new Date().toISOString(),
        });
        setBookmarked(true);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border transition-colors",
        bookmarked
          ? "border-circuit text-circuit bg-circuit/10"
          : "border-border text-text-muted hover:text-text hover:border-text",
        loading && "opacity-50 cursor-not-allowed",
        className,
      )}
      title={bookmarked ? "Remove bookmark" : "Bookmark"}
    >
      {bookmarked ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3.5 h-3.5"
        >
          <path
            fillRule="evenodd"
            d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.082l5.925 2.844A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-3.5 h-3.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
      )}
      {bookmarked ? "Saved" : "Save"}
    </button>
  );
}

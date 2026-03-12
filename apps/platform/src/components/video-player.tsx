"use client";

import { useState, useRef } from "react";
import { cn } from "@aaas/ui";

const FIREBASE_BASE =
  "https://firebasestorage.googleapis.com/v0/b/studio-1743338608-800f1.firebasestorage.app/o";

interface VideoPlayerProps {
  /** Firebase Storage path, e.g. "Video/AaaS_Teaser.mp4" */
  storagePath: string;
  /** Firebase Storage token for the file */
  token: string;
  /** Optional poster/thumbnail image URL */
  poster?: string;
  /** Aspect ratio class — defaults to "aspect-video" */
  aspect?: string;
  /** Additional class names */
  className?: string;
  /** Play button size — "lg" for hero, "sm" for inline */
  buttonSize?: "lg" | "sm";
}

function firebaseUrl(path: string, token: string) {
  return `${FIREBASE_BASE}/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

export function VideoPlayer({
  storagePath,
  token,
  poster,
  aspect = "aspect-video",
  className,
  buttonSize = "lg",
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handlePlay() {
    setPlaying(true);
    // Small delay so the video element mounts before we call play()
    requestAnimationFrame(() => {
      videoRef.current?.play();
    });
  }

  function handleEnded() {
    setPlaying(false);
  }

  const btnSize = buttonSize === "lg" ? "w-20 h-20" : "w-14 h-14";
  const iconSize = buttonSize === "lg" ? "text-4xl" : "text-2xl";

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden group bg-basalt-deep",
        aspect,
        className
      )}
    >
      {playing ? (
        <video
          ref={videoRef}
          src={firebaseUrl(storagePath, token)}
          controls
          onEnded={handleEnded}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <>
          {poster && (
            <img
              src={poster}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <button
              onClick={handlePlay}
              aria-label="Play video"
              className={cn(
                btnSize,
                "glass rounded-full flex items-center justify-center",
                "text-text transition-transform duration-300",
                "hover:scale-110 hover:shadow-[0_0_30px_var(--circuit-dim)]",
                "border border-circuit/20"
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={iconSize}
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

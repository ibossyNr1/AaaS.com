"use client";

export function MergeBackground() {
  return (
    <>
      {/* SVG filter for background merging */}
      <svg className="absolute invisible" aria-hidden="true">
        <defs>
          <filter id="gooey-bg">
            <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Chromium canvas — ambient radial glow */}
      <div
        className="fixed inset-0 -z-[3] pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 40%, #111 0%, rgb(var(--basalt-deep)) 70%)" }}
      />

      {/* Merging white metaballs — fixed background */}
      <div
        className="fixed inset-0 -z-[1] overflow-hidden pointer-events-none opacity-[0.06]"
        style={{ filter: "url(#gooey-bg)", contain: "layout style" }}
      >
        <div
          className="absolute rounded-full bg-white will-change-transform"
          style={{
            width: 200, height: 200,
            left: "45%", top: "35%",
            animation: "merge-orbit-a 20s infinite linear",
            ["--radius" as string]: "130px",
          }}
        />
        <div
          className="absolute rounded-full bg-white will-change-transform"
          style={{
            width: 150, height: 150,
            left: "50%", top: "40%",
            animation: "merge-orbit-b 26s infinite linear",
            ["--radius" as string]: "90px",
            animationDelay: "-5s",
          }}
        />
        <div
          className="absolute rounded-full bg-white will-change-transform"
          style={{
            width: 180, height: 180,
            left: "40%", top: "30%",
            animation: "merge-drift 30s infinite alternate var(--liquid-ease)",
          }}
        />
      </div>

      {/* Colored accent blobs */}
      <div className="fixed inset-0 -z-[1] overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full blur-[60px] opacity-[0.08] will-change-transform"
          style={{
            width: 450, height: 450,
            top: "-5%", left: "-10%",
            background: "radial-gradient(circle, rgb(var(--circuit-glow)) 0%, transparent 70%)",
            animation: "blob-drift 20s infinite alternate var(--liquid-ease)",
          }}
        />
        <div
          className="absolute rounded-full blur-[60px] opacity-[0.06] will-change-transform"
          style={{
            width: 350, height: 350,
            bottom: "10%", right: "-5%",
            background: "radial-gradient(circle, rgb(var(--accent-red)) 0%, transparent 70%)",
            animation: "blob-drift 20s infinite alternate var(--liquid-ease)",
            animationDelay: "-8s",
          }}
        />
      </div>
    </>
  );
}

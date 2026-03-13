"use client";

export function AuraBackground() {
  return (
    <div
      className="fixed inset-0 -z-[2] overflow-hidden pointer-events-none"
      style={{
        filter: "blur(80px) contrast(1.2)",
        opacity: 0.5,
        mixBlendMode: "var(--aura-blend)" as React.CSSProperties["mixBlendMode"],
      }}
    >
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: "60vw",
          height: "60vw",
          maxWidth: 900,
          maxHeight: 900,
          top: "-10%",
          left: "-10%",
          background: "radial-gradient(circle, rgb(var(--accent-red)) 0%, transparent 70%)",
          animation: "aura-drift 20s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: "50vw",
          height: "50vw",
          maxWidth: 750,
          maxHeight: 750,
          bottom: "-5%",
          right: "-5%",
          background: "radial-gradient(circle, rgb(var(--circuit-glow)) 0%, transparent 70%)",
          animation: "aura-drift 25s ease-in-out infinite alternate",
          animationDelay: "-8s",
        }}
      />
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: "35vw",
          height: "35vw",
          maxWidth: 550,
          maxHeight: 550,
          top: "30%",
          left: "15%",
          background: "radial-gradient(circle, rgb(var(--pastel-lavender) / 0.5) 0%, transparent 70%)",
          animation: "aura-drift 22s ease-in-out infinite alternate",
          animationDelay: "-4s",
        }}
      />
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: "30vw",
          height: "30vw",
          maxWidth: 450,
          maxHeight: 450,
          top: "10%",
          right: "10%",
          background: "radial-gradient(circle, rgb(var(--pastel-mint) / 0.4) 0%, transparent 70%)",
          animation: "aura-drift 18s ease-in-out infinite alternate",
          animationDelay: "-12s",
        }}
      />
    </div>
  );
}

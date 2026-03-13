"use client";

export function MetaballField() {
  return (
    <>
      <svg className="absolute invisible" aria-hidden="true">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div
        className="absolute right-0 top-[10%] w-[55%] h-[75%] pointer-events-none z-0 hidden lg:block"
        style={{ filter: "url(#gooey)" }}
      >
        <div
          className="absolute rounded-full opacity-[0.06] will-change-transform"
          style={{
            width: 160, height: 160,
            left: "20%", top: "20%",
            background: "var(--circuit-glow)",
            animation: "metaball-orbit 14s infinite linear",
            ["--orbit-radius" as string]: "90px",
          }}
        />
        <div
          className="absolute rounded-full opacity-[0.04] will-change-transform"
          style={{
            width: 200, height: 200,
            left: "45%", top: "45%",
            background: "rgb(var(--text))",
            animation: "metaball-orbit 18s infinite linear",
            ["--orbit-radius" as string]: "120px",
            animationDelay: "-3s",
          }}
        />
        <div
          className="absolute rounded-full opacity-[0.05] will-change-transform"
          style={{
            width: 130, height: 130,
            left: "60%", top: "25%",
            background: "rgb(var(--accent-red))",
            animation: "metaball-orbit 22s infinite linear",
            ["--orbit-radius" as string]: "70px",
            animationDelay: "-6s",
          }}
        />
        <div
          className="absolute rounded-full opacity-[0.04] will-change-transform"
          style={{
            width: 100, height: 100,
            left: "30%", top: "65%",
            background: "rgb(var(--text))",
            animation: "metaball-orbit 12s infinite linear",
            ["--orbit-radius" as string]: "60px",
            animationDelay: "-9s",
          }}
        />
        <div
          className="absolute rounded-full opacity-[0.06] will-change-transform"
          style={{
            width: 80, height: 80,
            left: "70%", top: "60%",
            background: "var(--circuit-glow)",
            animation: "metaball-orbit 16s infinite linear",
            ["--orbit-radius" as string]: "50px",
            animationDelay: "-4s",
          }}
        />
      </div>
    </>
  );
}

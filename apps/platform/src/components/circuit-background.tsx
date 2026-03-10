export function CircuitBackground() {
  return (
    <>
      {/* Circuit grid */}
      <div className="circuit-grid" aria-hidden="true" />

      {/* Animated SVG circuit paths — circuit + red */}
      <svg
        className="fixed top-0 left-0 w-full h-full -z-10 opacity-15 pointer-events-none"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Circuit paths */}
        <path
          d="M 0 100 H 200 V 300 H 400 V 100 H 600 V 500 H 1000"
          stroke="rgb(var(--circuit-glow))"
          strokeWidth="0.8"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          className="animate-circuit-flow"
        />
        <path
          d="M 1000 900 H 800 V 700 H 600 V 900 H 400 V 500 H 0"
          stroke="rgb(var(--circuit-glow))"
          strokeWidth="0.8"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          className="animate-circuit-flow"
          style={{ animationDelay: "3s" }}
        />
        <path
          d="M 200 0 V 400 H 400 V 600 H 200 V 1000"
          stroke="rgb(var(--circuit-glow))"
          strokeWidth="0.8"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          className="animate-circuit-flow"
          style={{ animationDelay: "6s" }}
        />

        {/* Red accent paths */}
        <path
          d="M 800 0 V 200 H 600 V 400 H 800 V 600 H 1000"
          stroke="rgb(var(--accent-red))"
          strokeWidth="0.5"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          className="animate-circuit-flow"
          style={{ animationDelay: "4s" }}
          opacity="0.6"
        />
        <path
          d="M 0 600 H 100 V 800 H 300 V 700 H 500 V 1000"
          stroke="rgb(var(--accent-red))"
          strokeWidth="0.5"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          className="animate-circuit-flow"
          style={{ animationDelay: "8s" }}
          opacity="0.4"
        />

        {/* Junction dots */}
        <circle cx="200" cy="300" r="2" fill="rgb(var(--circuit-glow))" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="600" cy="500" r="2" fill="rgb(var(--circuit-glow))" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" begin="1s" />
        </circle>
        <circle cx="800" cy="400" r="1.5" fill="rgb(var(--accent-red))" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite" begin="2s" />
        </circle>
      </svg>
    </>
  );
}

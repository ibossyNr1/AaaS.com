export function CircuitBackground() {
  return (
    <svg
      className="fixed top-0 left-0 w-full h-full -z-10 opacity-10 pointer-events-none"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M 0 100 H 200 V 300 H 400 V 100 H 600 V 500 H 1000"
        stroke="rgb(var(--circuit-glow))"
        strokeWidth="0.8"
        fill="none"
        strokeDasharray="60 940"
        opacity="0.6"
      >
        <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="0.8s" repeatCount="indefinite" />
      </path>
      <path
        d="M 1000 900 H 800 V 700 H 600 V 900 H 400 V 500 H 0"
        stroke="rgb(var(--circuit-glow))"
        strokeWidth="0.8"
        fill="none"
        strokeDasharray="40 960"
        opacity="0.4"
      >
        <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1.2s" repeatCount="indefinite" begin="0.3s" />
      </path>
      <path
        d="M 200 0 V 400 H 400 V 600 H 200 V 1000"
        stroke="rgb(var(--circuit-glow))"
        strokeWidth="0.8"
        fill="none"
        strokeDasharray="50 950"
        opacity="0.5"
      >
        <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1s" repeatCount="indefinite" begin="0.6s" />
      </path>
      <path
        d="M 800 0 V 200 H 600 V 400 H 800 V 600 H 1000"
        stroke="rgb(var(--accent-red))"
        strokeWidth="0.5"
        fill="none"
        strokeDasharray="30 970"
        opacity="0.4"
      >
        <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="0.9s" repeatCount="indefinite" begin="0.15s" />
      </path>
      <path
        d="M 0 600 H 100 V 800 H 300 V 700 H 500 V 1000"
        stroke="rgb(var(--accent-red))"
        strokeWidth="0.5"
        fill="none"
        strokeDasharray="35 965"
        opacity="0.3"
      >
        <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1.1s" repeatCount="indefinite" begin="0.5s" />
      </path>
      <circle cx="200" cy="300" r="2" fill="rgb(var(--circuit-glow))" opacity="0.3">
        <animate attributeName="opacity" values="0.1;0.8;0.1" dur="0.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="600" cy="500" r="2" fill="rgb(var(--circuit-glow))" opacity="0.3">
        <animate attributeName="opacity" values="0.1;0.8;0.1" dur="0.6s" repeatCount="indefinite" begin="0.2s" />
      </circle>
      <circle cx="800" cy="400" r="1.5" fill="rgb(var(--accent-red))" opacity="0.3">
        <animate attributeName="opacity" values="0.1;0.6;0.1" dur="0.7s" repeatCount="indefinite" begin="0.4s" />
      </circle>
    </svg>
  );
}

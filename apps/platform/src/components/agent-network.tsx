"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  label: string;
  pulsePhase: number;
}

const AGENT_COLORS = [
  "#55b8ff", // blue
  "#939aff", // purple
  "#69d4a6", // green
  "#ef97b1", // pink
  "#f8d974", // gold
];

const AGENT_LABELS = [
  "Research",
  "Marketing",
  "Analytics",
  "Sales",
  "DevOps",
  "Strategy",
  "Outreach",
  "Compliance",
  "Content",
  "Finance",
];

export function AgentNetwork({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: -1, y: -1 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Initialize nodes
    const rect = canvas.getBoundingClientRect();
    nodesRef.current = Array.from({ length: 10 }, (_, i) => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: 4 + Math.random() * 4,
      color: AGENT_COLORS[i % AGENT_COLORS.length],
      label: AGENT_LABELS[i],
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1, y: -1 };
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const animate = () => {
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      const nodes = nodesRef.current;
      const t = Date.now() / 1000;

      // Update positions
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 20 || node.x > r.width - 20) node.vx *= -1;
        if (node.y < 20 || node.y > r.height - 20) node.vy *= -1;

        node.x = Math.max(20, Math.min(r.width - 20, node.x));
        node.y = Math.max(20, Math.min(r.height - 20, node.y));
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 180;

          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * 0.3;
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();

            // Traveling dot
            const dotProgress = (t * 0.5 + i * 0.1) % 1;
            const dotX =
              nodes[i].x + (nodes[j].x - nodes[i].x) * dotProgress;
            const dotY =
              nodes[i].y + (nodes[j].y - nodes[i].y) * dotProgress;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 2})`;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw nodes
      const mouse = mouseRef.current;
      for (const node of nodes) {
        const pulse = Math.sin(t * 2 + node.pulsePhase) * 0.3 + 1;
        const isHovered =
          mouse.x > 0 &&
          Math.hypot(mouse.x - node.x, mouse.y - node.y) < 40;

        // Glow
        const glowRadius = (isHovered ? 30 : 20) * pulse;
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          glowRadius
        );
        gradient.addColorStop(0, node.color + "40");
        gradient.addColorStop(1, node.color + "00");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core
        const coreRadius =
          (isHovered ? node.radius * 1.5 : node.radius) * pulse;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        // Label on hover
        if (isHovered) {
          ctx.fillStyle = "#f0f2f5";
          ctx.font = "12px var(--font-geist-mono), monospace";
          ctx.textAlign = "center";
          ctx.fillText(node.label, node.x, node.y - 20);
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

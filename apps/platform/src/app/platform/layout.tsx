import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform | Agent-as-a-Service",
  description:
    "Context-first agent architecture. Evolution loop, capability grid, and adaptive intelligence.",
  openGraph: {
    title: "The AaaS Platform",
    description: "Context-First Agent Architecture",
  },
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

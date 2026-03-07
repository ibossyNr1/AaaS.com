import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vault | Agent-as-a-Service",
  description:
    "Browse 4,200+ structured business assets. Personas, frameworks, templates, and strategies — all agent-ready.",
  openGraph: {
    title: "The AaaS Vault",
    description: "Structured Intelligence",
  },
};

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

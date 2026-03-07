import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Agent-as-a-Service",
  description:
    "Flexible pricing for autonomous agent infrastructure. Retainer, pay-per-task, or equity partnership.",
  openGraph: {
    title: "AaaS Pricing",
    description: "Investment in Intelligence",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

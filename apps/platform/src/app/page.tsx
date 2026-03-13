import type { Metadata } from "next";
import { DeliveryClient } from "./delivery/client";

export const metadata: Metadata = {
  title: "Agent-as-a-Service | AaaS Framework",
  description:
    "AaaS encodes your business DNA into structured context for autonomous AI agents. For founders, partners, ambassadors, and investors.",
  openGraph: {
    title: "Agent-as-a-Service | AaaS Framework",
    description: "Context is the moat. We own the encoding.",
  },
};

export default function Home() {
  return <DeliveryClient />;
}

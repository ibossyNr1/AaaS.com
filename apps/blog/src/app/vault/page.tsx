import { Container, Section } from "@aaas/ui";
import { VaultClient } from "./vault-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vault — AaaS Knowledge Index",
  description:
    "Manage your AaaS Vault subscription, channel alerts, digest preferences, and cross-platform integration.",
};

export default function VaultPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Vault
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Manage your subscription, channel alerts, and digest preferences.
            Your Vault connects the Knowledge Index to the AaaS platform.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-5xl">
          <VaultClient />
        </Container>
      </Section>
    </>
  );
}

import { Container, Section } from "@aaas/ui";
import { AdminClient } from "./admin-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard — AaaS Knowledge Index",
  description:
    "Administrative dashboard for managing the AaaS Knowledge Index. Entity management, agent controls, and system configuration.",
};

export default function AdminPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Admin Dashboard
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Entity management, agent controls, and system configuration.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-6xl">
          <AdminClient />
        </Container>
      </Section>
    </>
  );
}

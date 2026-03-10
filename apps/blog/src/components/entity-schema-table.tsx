import { Card, Container, Section } from "@aaas/ui";
import type { Entity } from "@/lib/types";

function Row({ label, value }: { label: string; value: string | string[] | number | boolean | undefined | null }) {
  if (value === undefined || value === null || value === "") return null;

  const display = Array.isArray(value) ? value.join(", ") : String(value);

  return (
    <div className="flex py-2 border-b border-white/5 last:border-0">
      <dt className="w-1/3 text-xs font-mono uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="w-2/3 text-sm text-text">
        {display}
      </dd>
    </div>
  );
}

function TypeSpecificRows({ entity }: { entity: Entity }) {
  switch (entity.type) {
    case "tool":
      return (
        <>
          <Row label="SDK Languages" value={entity.sdkLanguages} />
          <Row label="Deployment" value={entity.deploymentOptions} />
          <Row label="Rate Limits" value={entity.rateLimits} />
          <Row label="Data Privacy" value={entity.dataPrivacy} />
        </>
      );
    case "model":
      return (
        <>
          <Row label="Parameters" value={entity.parameterCount} />
          <Row label="Context Window" value={entity.contextWindow} />
          <Row label="Modalities" value={entity.modalities} />
          <Row label="Training Cutoff" value={entity.trainingDataCutoff} />
        </>
      );
    case "agent":
      return (
        <>
          <Row label="Autonomy Level" value={entity.autonomyLevel} />
          <Row label="Tools Used" value={entity.toolsUsed} />
          <Row label="Skills" value={entity.skills} />
          <Row label="Trust Score" value={entity.trustScore} />
        </>
      );
    case "skill":
      return (
        <>
          <Row label="Difficulty" value={entity.difficulty} />
          <Row label="Prerequisites" value={entity.prerequisites} />
          <Row label="Supported Agents" value={entity.supportedAgents} />
        </>
      );
    case "script":
      return (
        <>
          <Row label="Language" value={entity.language} />
          <Row label="Dependencies" value={entity.dependencies} />
          <Row label="Environment" value={entity.executionEnvironment} />
          <Row label="Est. Runtime" value={entity.estimatedRuntime} />
        </>
      );
    case "benchmark":
      return (
        <>
          <Row label="Evaluated Models" value={entity.evaluatedModels} />
          <Row label="Metrics" value={entity.metrics} />
          <Row label="Methodology" value={entity.methodology} />
          <Row label="Last Run" value={entity.lastRunDate} />
        </>
      );
  }
}

export function EntitySchemaTable({ entity }: { entity: Entity }) {
  return (
    <Section className="py-8">
      <Container className="max-w-4xl">
        <Card>
          <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
            Specifications
          </h2>
          <dl>
            <Row label="License" value={entity.license} />
            <Row label="Pricing" value={entity.pricingModel} />
            <Row label="Capabilities" value={entity.capabilities} />
            <Row label="Integrations" value={entity.integrations} />
            <Row label="Use Cases" value={entity.useCases} />
            <Row label="API Available" value={entity.apiAvailable ? "Yes" : "No"} />
            <TypeSpecificRows entity={entity} />
            <Row label="Tags" value={entity.tags} />
            <Row label="Added" value={entity.addedDate} />
            <Row label="Completeness" value={`${entity.schemaCompleteness}%`} />
          </dl>
        </Card>
      </Container>
    </Section>
  );
}

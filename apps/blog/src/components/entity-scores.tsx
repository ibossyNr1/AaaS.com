import { Card, Container, Section } from "@aaas/ui";
import type { Entity } from "@/lib/types";

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs font-mono uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <div className="flex-grow h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-circuit rounded-full transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-xs font-mono text-circuit text-right">{value}</span>
    </div>
  );
}

export function EntityScores({ entity }: { entity: Entity }) {
  return (
    <Section className="py-8">
      <Container className="max-w-4xl">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-mono uppercase tracking-wider text-circuit">
              Index Score
            </h2>
            <span className="text-2xl font-bold text-circuit">
              {entity.scores.composite}
            </span>
          </div>
          <div className="space-y-4">
            <ScoreBar label="Adoption" value={entity.scores.adoption} />
            <ScoreBar label="Quality" value={entity.scores.quality} />
            <ScoreBar label="Freshness" value={entity.scores.freshness} />
            <ScoreBar label="Citations" value={entity.scores.citations} />
            <ScoreBar label="Engagement" value={entity.scores.engagement} />
          </div>
        </Card>
      </Container>
    </Section>
  );
}

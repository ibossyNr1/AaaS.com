import { Container, Section, KineticBar } from "@aaas/ui";
import { FadeUp, CountUp } from "./motion";

const metrics = [
  { value: 12, suffix: "+", label: "Active Agents" },
  { value: 142, suffix: "k+", label: "Skill Calls" },
  { value: 4, suffix: "", label: "Live Projects" },
  { value: 4200, suffix: "+", label: "Vault Entries" },
];

export function MetricsStrip() {
  return (
    <>
      <KineticBar variant="red" />
      <Section variant="bedrock" className="py-16">
        <Container>
          <FadeUp>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {metrics.map((m) => (
                <div key={m.label} className="group">
                  <div className="text-3xl md:text-4xl font-bold font-mono text-circuit group-hover:text-glow transition-all">
                    <CountUp end={m.value} suffix={m.suffix} />
                  </div>
                  <div className="font-mono text-xs uppercase tracking-wider text-text-muted mt-2">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </Container>
      </Section>
    </>
  );
}

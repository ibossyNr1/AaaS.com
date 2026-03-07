import { Hero } from "@/components/hero";
import { ValueStrip } from "@/components/value-strip";
import { ThreePillars } from "@/components/three-pillars";
import { ProcessStepper } from "@/components/process-stepper";
import { UseCases } from "@/components/use-cases";
import { MetricsStrip } from "@/components/metrics-strip";
import { CTABlock } from "@/components/cta-block";

export default function Home() {
  return (
    <>
      <Hero />
      <ValueStrip />
      <ThreePillars />
      <ProcessStepper />
      <UseCases />
      <MetricsStrip />
      <CTABlock />
    </>
  );
}

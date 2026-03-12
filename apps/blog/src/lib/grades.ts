/** Health grade system for entity scores */

export interface HealthGrade {
  letter: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";
  label: string;
  color: string;
  bgColor: string;
}

const GRADES: HealthGrade[] = [
  { letter: "A+", label: "Excellent", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  { letter: "A", label: "Great", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  { letter: "B+", label: "Good", color: "text-circuit", bgColor: "bg-circuit/10" },
  { letter: "B", label: "Above Average", color: "text-circuit", bgColor: "bg-circuit/10" },
  { letter: "C+", label: "Average", color: "text-amber-400", bgColor: "bg-amber-500/10" },
  { letter: "C", label: "Below Average", color: "text-amber-400", bgColor: "bg-amber-500/10" },
  { letter: "D", label: "Poor", color: "text-orange-400", bgColor: "bg-orange-500/10" },
  { letter: "F", label: "Critical", color: "text-red-400", bgColor: "bg-red-500/10" },
];

/**
 * Compute a health grade from a composite score (0-100).
 * A+: 90-100, A: 80-89, B+: 70-79, B: 60-69, C+: 50-59, C: 40-49, D: 25-39, F: 0-24
 */
export function computeGrade(composite: number): HealthGrade {
  const score = Math.max(0, Math.min(100, composite));

  if (score >= 90) return GRADES[0]; // A+
  if (score >= 80) return GRADES[1]; // A
  if (score >= 70) return GRADES[2]; // B+
  if (score >= 60) return GRADES[3]; // B
  if (score >= 50) return GRADES[4]; // C+
  if (score >= 40) return GRADES[5]; // C
  if (score >= 25) return GRADES[6]; // D
  return GRADES[7]; // F
}

const DIMENSION_LABELS: Record<string, string> = {
  adoption: "Adoption",
  quality: "Quality",
  freshness: "Freshness",
  citations: "Citations",
  engagement: "Engagement",
};

/**
 * Compute detailed grades for all score dimensions plus an overall grade.
 */
export function computeDetailedGrades(scores: {
  adoption?: number;
  quality?: number;
  freshness?: number;
  citations?: number;
  engagement?: number;
  composite?: number;
}): {
  overall: HealthGrade;
  dimensions: { key: string; label: string; grade: HealthGrade; score: number }[];
} {
  const composite = scores.composite ?? 0;
  const overall = computeGrade(composite);

  const dimensionKeys = ["adoption", "quality", "freshness", "citations", "engagement"] as const;

  const dimensions = dimensionKeys
    .filter((key) => scores[key] !== undefined)
    .map((key) => ({
      key,
      label: DIMENSION_LABELS[key],
      grade: computeGrade(scores[key]!),
      score: scores[key]!,
    }));

  return { overall, dimensions };
}

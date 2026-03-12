/**
 * Trending Detection Agent
 *
 * Detects entities with significant score changes by comparing current
 * composite scores against stored snapshots. Flags entities trending
 * up or down by >= 15 points and writes alerts to `trending_alerts`.
 *
 * Usage:
 *   npx tsx src/agents/trending-agent.ts
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "trending";
const SCORE_THRESHOLD = 15;
const DEDUP_WINDOW_DAYS = 7;
const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"] as const;

interface TrendingAlert {
  entityType: string;
  entitySlug: string;
  entityName: string;
  direction: "up" | "down";
  previousScore: number;
  currentScore: number;
  delta: number;
  detectedAt: string;
}

/**
 * Check if a duplicate alert already exists within the dedup window.
 */
async function isDuplicate(entityType: string, entitySlug: string, direction: string): Promise<boolean> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DEDUP_WINDOW_DAYS);
  const cutoffISO = cutoff.toISOString();

  const snap = await db
    .collection("trending_alerts")
    .where("entityType", "==", entityType)
    .where("entitySlug", "==", entitySlug)
    .where("direction", "==", direction)
    .where("detectedAt", ">=", cutoffISO)
    .limit(1)
    .get();

  return !snap.empty;
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting trending detection...`);

  let totalEntities = 0;
  let trendingUp = 0;
  let trendingDown = 0;
  let duplicatesSkipped = 0;
  let noSnapshotCount = 0;

  for (const collection of ENTITY_COLLECTIONS) {
    console.log(`  Scanning ${collection}...`);

    const entitiesSnap = await db.collection(collection).get();

    for (const doc of entitiesSnap.docs) {
      totalEntities++;
      const entity = doc.data();
      const slug = doc.id;
      const currentScore = entity.scores?.composite ?? 0;
      const entityName = entity.name || entity.title || slug;

      // Read snapshot
      const snapshotId = `${collection}__${slug}`;
      const snapshotDoc = await db.collection("entity_snapshots").doc(snapshotId).get();

      if (!snapshotDoc.exists) {
        noSnapshotCount++;
        continue;
      }

      const snapshotData = snapshotDoc.data();
      const previousScore = snapshotData?.data?.scores?.composite ?? 0;
      const delta = currentScore - previousScore;

      if (Math.abs(delta) < SCORE_THRESHOLD) {
        continue;
      }

      const direction: "up" | "down" = delta > 0 ? "up" : "down";

      // Dedup check
      const dup = await isDuplicate(collection, slug, direction);
      if (dup) {
        duplicatesSkipped++;
        console.log(`    [SKIP] ${slug} (${direction}, duplicate within ${DEDUP_WINDOW_DAYS}d)`);
        continue;
      }

      const alert: TrendingAlert = {
        entityType: collection,
        entitySlug: slug,
        entityName,
        direction,
        previousScore,
        currentScore,
        delta,
        detectedAt: new Date().toISOString(),
      };

      await db.collection("trending_alerts").add(alert);

      if (direction === "up") {
        trendingUp++;
        console.log(`    [UP]   ${slug}: ${previousScore} -> ${currentScore} (+${delta})`);
      } else {
        trendingDown++;
        console.log(`    [DOWN] ${slug}: ${previousScore} -> ${currentScore} (${delta})`);
      }
    }
  }

  const summary = {
    totalEntities,
    trendingUp,
    trendingDown,
    duplicatesSkipped,
    noSnapshotCount,
  };

  console.log(`\n[${AGENT_NAME}] Complete.`);
  console.log(`  Scanned: ${totalEntities} entities`);
  console.log(`  Trending up: ${trendingUp}`);
  console.log(`  Trending down: ${trendingDown}`);
  console.log(`  Duplicates skipped: ${duplicatesSkipped}`);
  console.log(`  No snapshot: ${noSnapshotCount}`);

  await logAgentAction(AGENT_NAME, "trending_detection_complete", summary, true);
}

// Direct execution
if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`[${AGENT_NAME}] Fatal error:`, err);
      process.exit(1);
    });
}

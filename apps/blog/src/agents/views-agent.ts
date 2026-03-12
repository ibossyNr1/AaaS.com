/**
 * Views Agent
 *
 * Aggregates page views into entity engagement scores.
 *
 * Behavior:
 * 1. Query page_views from the last 7 days where entitySlug is set
 * 2. Group by entityType + entitySlug and count views per entity
 * 3. Normalize to 0-100 scale (most viewed = 100, least = proportional)
 * 4. Update each entity's scores.engagement field in Firestore
 * 5. Clean up page_views older than 30 days (batch delete)
 *
 * Schedule: daily
 * Idempotent: yes — recalculates from scratch on every run
 */

import { db, logAgentAction } from "./logger";
import { FieldValue } from "firebase-admin/firestore";

const AGENT_NAME = "views-agent";

const ENTITY_COLLECTIONS: Record<string, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

interface ViewCount {
  entityType: string;
  entitySlug: string;
  count: number;
}

export async function run(): Promise<void> {
  console.log("[views-agent] Starting page view aggregation...");

  // --- Step 1: Query page views from the last 7 days with entitySlug ---
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffDate = sevenDaysAgo.toISOString().slice(0, 10);

  const viewsSnap = await db
    .collection("page_views")
    .where("date", ">=", cutoffDate)
    .get();

  // Filter to only views with entitySlug set
  const entityViews = viewsSnap.docs.filter(
    (doc) => doc.data().entitySlug && doc.data().entityType
  );

  console.log(
    `[views-agent] Found ${entityViews.length} entity page views in the last 7 days (${viewsSnap.size} total views)`
  );

  if (entityViews.length === 0) {
    console.log("[views-agent] No entity views to process. Skipping score update.");
    await logAgentAction(AGENT_NAME, "aggregate_views", {
      totalViews: viewsSnap.size,
      entityViews: 0,
      entitiesUpdated: 0,
    }, true);
    // Still run cleanup
    await cleanupOldViews();
    return;
  }

  // --- Step 2: Group by entityType + entitySlug ---
  const viewCounts = new Map<string, ViewCount>();

  for (const doc of entityViews) {
    const data = doc.data();
    const key = `${data.entityType}:${data.entitySlug}`;

    if (!viewCounts.has(key)) {
      viewCounts.set(key, {
        entityType: data.entityType,
        entitySlug: data.entitySlug,
        count: 0,
      });
    }
    viewCounts.get(key)!.count++;
  }

  console.log(`[views-agent] Aggregated views for ${viewCounts.size} unique entities`);

  // --- Step 3: Normalize to 0-100 scale ---
  const entries = Array.from(viewCounts.values());
  const maxCount = Math.max(...entries.map((e) => e.count));

  const normalizedScores = entries.map((entry) => ({
    ...entry,
    engagement: maxCount > 0 ? Math.round((entry.count / maxCount) * 100) : 0,
  }));

  // --- Step 4: Update entity engagement scores in Firestore ---
  let updatedCount = 0;
  let missingCount = 0;

  for (const entry of normalizedScores) {
    const collectionName = ENTITY_COLLECTIONS[entry.entityType];
    if (!collectionName) {
      console.warn(
        `[views-agent] Unknown entity type: ${entry.entityType}, skipping`
      );
      continue;
    }

    // Find the entity document by slug
    const entitySnap = await db
      .collection(collectionName)
      .where("slug", "==", entry.entitySlug)
      .limit(1)
      .get();

    if (entitySnap.empty) {
      console.warn(
        `[views-agent] Entity not found: ${entry.entityType}/${entry.entitySlug}`
      );
      missingCount++;
      continue;
    }

    const docRef = entitySnap.docs[0].ref;
    await docRef.update({
      "scores.engagement": entry.engagement,
    });

    console.log(
      `  ${entry.entityType}/${entry.entitySlug}: ${entry.count} views -> engagement ${entry.engagement}`
    );
    updatedCount++;
  }

  console.log(
    `[views-agent] Updated engagement scores for ${updatedCount} entities (${missingCount} not found)`
  );

  await logAgentAction(
    AGENT_NAME,
    "aggregate_views",
    {
      totalViews: viewsSnap.size,
      entityViews: entityViews.length,
      uniqueEntities: viewCounts.size,
      entitiesUpdated: updatedCount,
      entitiesMissing: missingCount,
      maxViewCount: maxCount,
    },
    true
  );

  // --- Step 5: Clean up old page views ---
  await cleanupOldViews();
}

/**
 * Delete page_views older than 30 days in batches of 100.
 */
async function cleanupOldViews(): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString().slice(0, 10);

  let totalDeleted = 0;

  // Delete in batches
  while (true) {
    const oldSnap = await db
      .collection("page_views")
      .where("date", "<", cutoffDate)
      .limit(100)
      .get();

    if (oldSnap.empty) break;

    const batch = db.batch();
    for (const doc of oldSnap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();

    totalDeleted += oldSnap.size;
    console.log(`[views-agent] Deleted batch of ${oldSnap.size} old page views`);
  }

  if (totalDeleted > 0) {
    console.log(
      `[views-agent] Cleanup complete: deleted ${totalDeleted} page views older than 30 days`
    );
    await logAgentAction(AGENT_NAME, "cleanup_old_views", {
      deletedCount: totalDeleted,
      cutoffDate,
    }, true);
  } else {
    console.log("[views-agent] No old page views to clean up");
  }
}

// Direct execution support
if (require.main === module) {
  run()
    .then(() => {
      console.log("[views-agent] Done.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[views-agent] Fatal error:", err);
      process.exit(1);
    });
}

/**
 * Changelog Agent
 *
 * Tracks entity changes over time by comparing current Firestore data
 * against stored snapshots. When changes are detected, a changelog
 * entry is written to a subcollection on the entity document.
 *
 * Storage layout:
 *   entity_snapshots/{collection}/{slug}  — last known state
 *   {collection}/{slug}/changelog/{auto}  — individual change records
 *
 * Schedule: daily (runs before ranking to capture pre-rank state)
 * Idempotent: yes — only writes changelog when actual changes are detected
 */

import { db, logAgentAction } from "./logger";
import { diffEntities, type FieldChange } from "../lib/diff";
import { FieldValue } from "firebase-admin/firestore";

const AGENT_NAME = "changelog-agent";

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting changelog detection...`);

  let totalEntities = 0;
  let newSnapshots = 0;
  let changesDetected = 0;
  let totalChangedFields = 0;

  try {
    for (const collectionName of ENTITY_COLLECTIONS) {
      const snapshot = await db.collection(collectionName).get();

      for (const entityDoc of snapshot.docs) {
        totalEntities++;
        const slug = entityDoc.id;
        const currentData = entityDoc.data();
        const snapshotDocId = `${collectionName}/${slug}`;

        // Read last snapshot
        // Use a flat collection with encoded doc IDs to avoid nested subcollection complexity
        const snapshotRef = db.collection("entity_snapshots").doc(snapshotDocId.replace("/", "__"));
        const snapshotDoc = await snapshotRef.get();

        if (!snapshotDoc.exists) {
          // First time seeing this entity — create initial snapshot, no changelog entry
          await snapshotRef.set({
            collection: collectionName,
            slug,
            data: currentData,
            capturedAt: FieldValue.serverTimestamp(),
          });
          newSnapshots++;
          console.log(`  [new] ${collectionName}/${slug} — initial snapshot created`);
          continue;
        }

        // Compare previous snapshot with current data
        const previousData = snapshotDoc.data()?.data as Record<string, unknown>;
        if (!previousData) {
          // Corrupted snapshot — overwrite
          await snapshotRef.set({
            collection: collectionName,
            slug,
            data: currentData,
            capturedAt: FieldValue.serverTimestamp(),
          });
          newSnapshots++;
          continue;
        }

        const changes: FieldChange[] = diffEntities(previousData, currentData);

        if (changes.length > 0) {
          changesDetected++;
          totalChangedFields += changes.length;

          // Write changelog entry to subcollection on the entity document
          await db
            .collection(collectionName)
            .doc(slug)
            .collection("changelog")
            .add({
              changes: changes.map((c) => ({
                field: c.field,
                oldValue: c.oldValue ?? null,
                newValue: c.newValue ?? null,
                changeType: c.changeType,
              })),
              timestamp: FieldValue.serverTimestamp(),
              detectedBy: AGENT_NAME,
            });

          // Update snapshot to current data
          await snapshotRef.update({
            data: currentData,
            capturedAt: FieldValue.serverTimestamp(),
          });

          console.log(
            `  [changed] ${collectionName}/${slug} — ${changes.length} field(s): ${changes.map((c) => c.field).join(", ")}`,
          );
        }
      }
    }

    await logAgentAction(
      AGENT_NAME,
      "changelog_complete",
      { totalEntities, newSnapshots, changesDetected, totalChangedFields },
      true,
    );

    console.log(
      `[${AGENT_NAME}] Changelog detection complete. ${totalEntities} entities scanned, ${changesDetected} with changes (${totalChangedFields} fields), ${newSnapshots} new snapshots.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(
      AGENT_NAME,
      "changelog_failed",
      { totalEntities, newSnapshots, changesDetected, totalChangedFields },
      false,
      message,
    );
    console.error(`[${AGENT_NAME}] Changelog detection failed:`, message);
    throw err;
  }
}

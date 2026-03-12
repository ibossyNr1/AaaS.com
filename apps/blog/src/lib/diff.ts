/**
 * Entity Diff Utility
 *
 * Compares two entity snapshots field by field and returns a structured
 * list of changes. Used by the changelog agent to detect mutations.
 */

export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: "added" | "modified" | "removed";
}

/** Fields to ignore when computing diffs (timestamps change on every write) */
const IGNORED_FIELDS = new Set(["lastUpdated", "lastVerified"]);

/**
 * Deep-compare two values for equality.
 * Handles primitives, arrays, and plain objects.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => Object.prototype.hasOwnProperty.call(bObj, key) && deepEqual(aObj[key], bObj[key]));
  }

  return false;
}

/**
 * Compare two entity objects and return an array of field-level changes.
 *
 * Handles:
 * - Top-level primitives
 * - Nested objects (e.g. scores)
 * - Arrays (e.g. tags, capabilities)
 * - Added and removed fields
 *
 * Ignores: lastUpdated, lastVerified
 */
export function diffEntities(
  previous: Record<string, unknown>,
  current: Record<string, unknown>,
): FieldChange[] {
  const changes: FieldChange[] = [];
  const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);

  for (const key of allKeys) {
    if (IGNORED_FIELDS.has(key)) continue;

    const hasPrev = Object.prototype.hasOwnProperty.call(previous, key);
    const hasCurr = Object.prototype.hasOwnProperty.call(current, key);

    if (!hasPrev && hasCurr) {
      changes.push({ field: key, oldValue: undefined, newValue: current[key], changeType: "added" });
    } else if (hasPrev && !hasCurr) {
      changes.push({ field: key, oldValue: previous[key], newValue: undefined, changeType: "removed" });
    } else if (hasPrev && hasCurr) {
      const prevVal = previous[key];
      const currVal = current[key];

      // For nested objects (like scores), diff each sub-field
      if (
        prevVal != null &&
        currVal != null &&
        typeof prevVal === "object" &&
        typeof currVal === "object" &&
        !Array.isArray(prevVal) &&
        !Array.isArray(currVal)
      ) {
        const nestedChanges = diffEntities(
          prevVal as Record<string, unknown>,
          currVal as Record<string, unknown>,
        );
        for (const nc of nestedChanges) {
          changes.push({
            field: `${key}.${nc.field}`,
            oldValue: nc.oldValue,
            newValue: nc.newValue,
            changeType: nc.changeType,
          });
        }
      } else if (!deepEqual(prevVal, currVal)) {
        changes.push({ field: key, oldValue: prevVal, newValue: currVal, changeType: "modified" });
      }
    }
  }

  return changes;
}

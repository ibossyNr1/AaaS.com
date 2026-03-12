import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Types ──────────────────────────────────────────────────────────────

export interface CollectionEntity {
  entitySlug: string;
  entityType: string;
  addedAt: string;
  addedBy: string;
  note?: string;
  position: number;
}

export interface EntityCollection {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  slug: string;
  entities: CollectionEntity[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  coverImage?: string;
  tags: string[];
}

export interface Bookmark {
  userId: string;
  entitySlug: string;
  entityType: string;
  note?: string;
  tags: string[];
  createdAt: string;
}

// ── Firestore collection names ─────────────────────────────────────────

const COLLECTIONS_COL = "entity_collections";
const BOOKMARKS_COL = "bookmarks";

// ── Collection CRUD ────────────────────────────────────────────────────

/** Get all collections for a workspace */
export async function getCollections(workspaceId: string): Promise<EntityCollection[]> {
  const q = query(
    collection(db, COLLECTIONS_COL),
    where("workspaceId", "==", workspaceId),
    orderBy("updatedAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EntityCollection);
}

/** Get a single collection by ID */
export async function getCollection(collectionId: string): Promise<EntityCollection | null> {
  const ref = doc(db, COLLECTIONS_COL, collectionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as EntityCollection;
}

/** Create a new collection */
export async function createCollection(
  data: Omit<EntityCollection, "id" | "createdAt" | "updatedAt">,
): Promise<EntityCollection> {
  const now = new Date().toISOString();
  const ref = doc(collection(db, COLLECTIONS_COL));
  const record: EntityCollection = {
    ...data,
    id: ref.id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, record);
  return record;
}

/** Add an entity to a collection */
export async function addToCollection(
  collectionId: string,
  entity: Omit<CollectionEntity, "addedAt" | "position">,
): Promise<void> {
  const ref = doc(db, COLLECTIONS_COL, collectionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Collection not found");

  const data = snap.data() as EntityCollection;
  const existing = data.entities || [];

  // Prevent duplicates
  const alreadyExists = existing.some(
    (e) => e.entitySlug === entity.entitySlug && e.entityType === entity.entityType,
  );
  if (alreadyExists) return;

  const newEntity: CollectionEntity = {
    ...entity,
    addedAt: new Date().toISOString(),
    position: existing.length,
  };

  await updateDoc(ref, {
    entities: [...existing, newEntity],
    updatedAt: new Date().toISOString(),
  });
}

/** Remove an entity from a collection */
export async function removeFromCollection(
  collectionId: string,
  entitySlug: string,
  entityType: string,
): Promise<void> {
  const ref = doc(db, COLLECTIONS_COL, collectionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Collection not found");

  const data = snap.data() as EntityCollection;
  const filtered = (data.entities || [])
    .filter((e) => !(e.entitySlug === entitySlug && e.entityType === entityType))
    .map((e, i) => ({ ...e, position: i }));

  await updateDoc(ref, {
    entities: filtered,
    updatedAt: new Date().toISOString(),
  });
}

/** Reorder entities in a collection */
export async function reorderCollection(
  collectionId: string,
  entityOrder: string[],
): Promise<void> {
  const ref = doc(db, COLLECTIONS_COL, collectionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Collection not found");

  const data = snap.data() as EntityCollection;
  const entityMap = new Map(
    (data.entities || []).map((e) => [`${e.entityType}:${e.entitySlug}`, e]),
  );

  const reordered: CollectionEntity[] = entityOrder
    .map((key, i) => {
      const entity = entityMap.get(key);
      if (!entity) return null;
      return { ...entity, position: i };
    })
    .filter(Boolean) as CollectionEntity[];

  await updateDoc(ref, {
    entities: reordered,
    updatedAt: new Date().toISOString(),
  });
}

// ── Bookmarks ──────────────────────────────────────────────────────────

/** Get all bookmarks for a user */
export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  const q = query(
    collection(db, BOOKMARKS_COL),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Bookmark);
}

/** Toggle a bookmark — returns true if bookmarked, false if removed */
export async function toggleBookmark(
  userId: string,
  entitySlug: string,
  entityType: string,
): Promise<boolean> {
  const docId = `${userId}_${entityType}_${entitySlug}`;
  const ref = doc(db, BOOKMARKS_COL, docId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  }

  const bookmark: Bookmark = {
    userId,
    entitySlug,
    entityType,
    tags: [],
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, bookmark);
  return true;
}

// ── Public collections ─────────────────────────────────────────────────

/** Get public collections (featured/browsable) */
export async function getPublicCollections(limit = 20): Promise<EntityCollection[]> {
  const q = query(
    collection(db, COLLECTIONS_COL),
    where("isPublic", "==", true),
    orderBy("updatedAt", "desc"),
    firestoreLimit(limit),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EntityCollection);
}

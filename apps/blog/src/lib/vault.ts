/**
 * Vault Integration Layer
 *
 * Cross-platform bridge between the AaaS Knowledge Index (blog) and
 * the main AaaS platform Vault. Handles subscription management,
 * profile lookups, and webhook dispatch for subscriber notifications.
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const VAULT_BASE_URL =
  process.env.NEXT_PUBLIC_VAULT_URL || "https://agents-as-a-service.com";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubscriptionPlan = "free" | "pro" | "enterprise";
export type DigestFrequency = "daily" | "weekly" | "monthly" | "none";

export interface AlertPreferences {
  entityAlerts: boolean;
  channelAlerts: boolean;
  weeklyDigest: boolean;
  trendingAlerts: boolean;
}

export interface Subscription {
  plan: SubscriptionPlan;
  channels: string[];
  digestFrequency: DigestFrequency;
  alertPreferences: AlertPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface VaultProfile {
  displayName: string;
  email: string;
  avatarUrl?: string;
  plan: SubscriptionPlan;
  linkedAt?: string;
}

export interface WebhookQueueEntry {
  event: string;
  payload: Record<string, unknown>;
  targetUserId?: string;
  createdAt: string;
  delivered: boolean;
}

// ---------------------------------------------------------------------------
// Default alert preferences
// ---------------------------------------------------------------------------

const DEFAULT_ALERTS: AlertPreferences = {
  entityAlerts: true,
  channelAlerts: true,
  weeklyDigest: true,
  trendingAlerts: false,
};

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

/**
 * Read a user's subscription from Firestore.
 * Returns null when no subscription exists.
 */
export async function getVaultSubscription(
  userId: string,
): Promise<Subscription | null> {
  const ref = doc(db, "subscriptions", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as Subscription;
}

/**
 * Create or update a subscription for the given user.
 */
export async function createVaultSubscription(
  userId: string,
  plan: SubscriptionPlan,
  channels: string[] = [],
  digestFrequency: DigestFrequency = "weekly",
  alertPreferences: AlertPreferences = DEFAULT_ALERTS,
): Promise<Subscription> {
  const now = new Date().toISOString();
  const existing = await getVaultSubscription(userId);

  const subscription: Subscription = {
    plan,
    channels: channels.length > 0 ? channels : existing?.channels ?? [],
    digestFrequency,
    alertPreferences: { ...DEFAULT_ALERTS, ...alertPreferences },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const ref = doc(db, "subscriptions", userId);
  await setDoc(ref, subscription, { merge: true });
  return subscription;
}

// ---------------------------------------------------------------------------
// Vault Profiles
// ---------------------------------------------------------------------------

/**
 * Read a user's Vault profile from Firestore.
 * Returns null when no profile exists.
 */
export async function getVaultProfile(
  userId: string,
): Promise<VaultProfile | null> {
  const ref = doc(db, "vault_profiles", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as VaultProfile;
}

// ---------------------------------------------------------------------------
// Webhook Queue
// ---------------------------------------------------------------------------

/**
 * Write a notification event to the webhook_queue collection
 * for the Vault delivery agent to pick up.
 */
export async function notifyVaultSubscribers(event: {
  name: string;
  payload: Record<string, unknown>;
  targetUserId?: string;
}): Promise<string> {
  const entry: WebhookQueueEntry = {
    event: event.name,
    payload: event.payload,
    targetUserId: event.targetUserId,
    createdAt: new Date().toISOString(),
    delivered: false,
  };

  const ref = await addDoc(collection(db, "webhook_queue"), entry);
  return ref.id;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * List all active subscribers for a given channel.
 */
export async function getChannelSubscribers(
  channelSlug: string,
): Promise<string[]> {
  const q = query(
    collection(db, "subscriptions"),
    where("channels", "array-contains", channelSlug),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}

/**
 * List all subscribers whose alert preferences match the given flag.
 */
export async function getSubscribersWithAlert(
  alertKey: keyof AlertPreferences,
): Promise<string[]> {
  const q = query(
    collection(db, "subscriptions"),
    where(`alertPreferences.${alertKey}`, "==", true),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}

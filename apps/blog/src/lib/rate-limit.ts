import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ---------------------------------------------------------------------------
// Firebase Admin — singleton
// ---------------------------------------------------------------------------

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** ISO date string for the current day (UTC). */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** End-of-day timestamp (UTC) as epoch seconds — used for X-RateLimit-Reset. */
function endOfDayEpoch(): number {
  const now = new Date();
  const eod = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59),
  );
  return Math.floor(eod.getTime() / 1000);
}

// ---------------------------------------------------------------------------
// validateApiKey
// ---------------------------------------------------------------------------

export interface KeyDoc {
  id: string;
  name: string;
  email: string;
  rateLimit: number;
  requestCount: number;
}

export interface ValidateResult {
  valid: boolean;
  error?: string;
  keyDoc?: KeyDoc;
}

export async function validateApiKey(key: string): Promise<ValidateResult> {
  const hash = sha256(key);

  const snap = await db
    .collection("api_keys")
    .where("key", "==", hash)
    .limit(1)
    .get();

  if (snap.empty) {
    return { valid: false, error: "Invalid API key." };
  }

  const doc = snap.docs[0];
  const data = doc.data();

  if (data.status === "revoked") {
    return { valid: false, error: "API key has been revoked." };
  }

  const today = todayUTC();
  const lastDay = data.lastUsedAt ? data.lastUsedAt.slice(0, 10) : null;
  const currentCount = lastDay === today ? (data.requestCount ?? 0) : 0;
  const limit = data.rateLimit ?? 100;

  if (currentCount >= limit) {
    return {
      valid: false,
      error: `Rate limit exceeded. Limit: ${limit} requests/day.`,
    };
  }

  // Atomically increment count and update lastUsedAt
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> =
    lastDay === today
      ? { requestCount: currentCount + 1, lastUsedAt: now }
      : { requestCount: 1, lastUsedAt: now };

  await doc.ref.update(updateData);

  return {
    valid: true,
    keyDoc: {
      id: doc.id,
      name: data.name,
      email: data.email,
      rateLimit: limit,
      requestCount: currentCount + 1,
    },
  };
}

// ---------------------------------------------------------------------------
// Anonymous (IP-based) rate limiting
// ---------------------------------------------------------------------------

const ANON_LIMIT = 20;

async function checkAnonymous(ip: string): Promise<{
  allowed: boolean;
  error?: string;
  remaining?: number;
}> {
  const ipHash = sha256(ip);
  const docRef = db.collection("rate_limit_anonymous").doc(ipHash);
  const doc = await docRef.get();
  const today = todayUTC();

  if (doc.exists) {
    const data = doc.data()!;
    const lastDay = data.date ?? "";
    const count = lastDay === today ? (data.count ?? 0) : 0;

    if (count >= ANON_LIMIT) {
      return {
        allowed: false,
        error: `Anonymous rate limit exceeded. Limit: ${ANON_LIMIT} requests/day. Provide an x-api-key header for higher limits.`,
        remaining: 0,
      };
    }

    await docRef.set({ count: count + 1, date: today }, { merge: true });
    return { allowed: true, remaining: ANON_LIMIT - count - 1 };
  }

  await docRef.set({ count: 1, date: today });
  return { allowed: true, remaining: ANON_LIMIT - 1 };
}

// ---------------------------------------------------------------------------
// checkRateLimit — main entry point for API routes
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean;
  error?: string;
  remaining?: number;
  limit?: number;
}

export async function checkRateLimit(
  req: NextRequest,
): Promise<RateLimitResult> {
  const apiKey = req.headers.get("x-api-key")?.trim();

  if (!apiKey) {
    // Anonymous — use IP-based limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const result = await checkAnonymous(ip);
    return { ...result, limit: ANON_LIMIT };
  }

  // Authenticated
  const result = await validateApiKey(apiKey);

  if (!result.valid) {
    return {
      allowed: false,
      error: result.error,
      remaining: 0,
      limit: result.keyDoc?.rateLimit ?? 100,
    };
  }

  const kd = result.keyDoc!;
  return {
    allowed: true,
    remaining: kd.rateLimit - kd.requestCount,
    limit: kd.rateLimit,
  };
}

// ---------------------------------------------------------------------------
// rateLimitHeaders
// ---------------------------------------------------------------------------

export function rateLimitHeaders(
  remaining: number,
  limit: number,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(remaining, 0)),
    "X-RateLimit-Reset": String(endOfDayEpoch()),
  };
}

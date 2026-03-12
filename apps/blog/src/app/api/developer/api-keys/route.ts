import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// ---------------------------------------------------------------------------
// GET — list user's API keys (masked)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key")?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing x-api-key header. Authenticate with your API key to list keys." },
      { status: 401 },
    );
  }

  const keyHash = sha256(apiKey);

  try {
    // Find the key to get the email
    const keySnap = await db
      .collection("api_keys")
      .where("key", "==", keyHash)
      .limit(1)
      .get();

    if (keySnap.empty) {
      return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
    }

    const keyData = keySnap.docs[0].data();
    if (keyData.status === "revoked") {
      return NextResponse.json({ error: "API key has been revoked." }, { status: 401 });
    }

    const email = keyData.email;

    // Fetch all keys for this email
    const allKeysSnap = await db
      .collection("api_keys")
      .where("email", "==", email)
      .orderBy("createdAt", "desc")
      .get();

    const keys = allKeysSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        keyPrefix: d.keyPrefix + "...",
        name: d.name,
        status: d.status,
        requestCount: d.requestCount ?? 0,
        rateLimit: d.rateLimit ?? 100,
        createdAt: d.createdAt,
        lastUsedAt: d.lastUsedAt ?? null,
      };
    });

    return NextResponse.json({ keys, count: keys.length }, { status: 200 });
  } catch (error) {
    console.error("[developer/api-keys] GET error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — generate new API key (returns full key once)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const authKey = req.headers.get("x-api-key")?.trim();

  if (!authKey) {
    return NextResponse.json(
      { error: "Missing x-api-key header. Authenticate with an existing key to generate a new one." },
      { status: 401 },
    );
  }

  const authHash = sha256(authKey);

  try {
    // Verify the authenticating key
    const authSnap = await db
      .collection("api_keys")
      .where("key", "==", authHash)
      .limit(1)
      .get();

    if (authSnap.empty) {
      return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
    }

    const authData = authSnap.docs[0].data();
    if (authData.status === "revoked") {
      return NextResponse.json({ error: "API key has been revoked." }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const name = (body.name as string | undefined)?.trim() ?? "";
    const description = (body.description as string | undefined)?.trim() ?? "";

    if (!name || name.length < 3 || name.length > 50) {
      return NextResponse.json(
        { error: "Name is required (3-50 characters)." },
        { status: 400 },
      );
    }

    // Check key count for this email (max 5)
    const existingSnap = await db
      .collection("api_keys")
      .where("email", "==", authData.email)
      .where("status", "==", "active")
      .get();

    if (existingSnap.size >= 5) {
      return NextResponse.json(
        { error: "Maximum of 5 active API keys per account. Revoke an existing key first." },
        { status: 400 },
      );
    }

    // Generate new key
    const rawKey = "aaas_" + randomBytes(16).toString("hex");
    const keyHash = sha256(rawKey);
    const keyPrefix = rawKey.substring(0, 8);
    const now = new Date().toISOString();

    const record = {
      name,
      email: authData.email,
      description: description || null,
      key: keyHash,
      keyPrefix,
      createdAt: now,
      lastUsedAt: null,
      requestCount: 0,
      rateLimit: 100,
      status: "active" as const,
    };

    const docRef = await db.collection("api_keys").add(record);

    return NextResponse.json(
      {
        id: docRef.id,
        key: rawKey,
        keyPrefix,
        name,
        rateLimit: 100,
        createdAt: now,
        message: "Store this key securely. It will not be shown again.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[developer/api-keys] POST error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — revoke an API key by id (passed in body)
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest) {
  const authKey = req.headers.get("x-api-key")?.trim();

  if (!authKey) {
    return NextResponse.json(
      { error: "Missing x-api-key header." },
      { status: 401 },
    );
  }

  const authHash = sha256(authKey);

  try {
    // Verify the authenticating key
    const authSnap = await db
      .collection("api_keys")
      .where("key", "==", authHash)
      .limit(1)
      .get();

    if (authSnap.empty) {
      return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
    }

    const authData = authSnap.docs[0].data();
    if (authData.status === "revoked") {
      return NextResponse.json({ error: "Authenticating key has been revoked." }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body. Provide { \"keyId\": \"...\" }." }, { status: 400 });
    }

    const keyId = (body.keyId as string | undefined)?.trim();
    if (!keyId) {
      return NextResponse.json({ error: "keyId is required in the request body." }, { status: 400 });
    }

    const targetDoc = db.collection("api_keys").doc(keyId);
    const targetSnap = await targetDoc.get();

    if (!targetSnap.exists) {
      return NextResponse.json({ error: "API key not found." }, { status: 404 });
    }

    const targetData = targetSnap.data()!;

    // Verify ownership: same email
    if (targetData.email !== authData.email) {
      return NextResponse.json(
        { error: "Unauthorized — you can only revoke your own keys." },
        { status: 403 },
      );
    }

    if (targetData.status === "revoked") {
      return NextResponse.json({ error: "Key is already revoked." }, { status: 400 });
    }

    await targetDoc.update({ status: "revoked" });

    return NextResponse.json(
      { success: true, message: "API key revoked successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("[developer/api-keys] DELETE error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

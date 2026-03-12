import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    }

    // Check for duplicate
    const q = query(
      collection(db, "subscribers"),
      where("email", "==", email),
      where("active", "==", true),
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      return NextResponse.json(
        { error: "This email is already subscribed." },
        { status: 409 },
      );
    }

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomUUID();

    await addDoc(collection(db, "subscribers"), {
      email,
      subscribedAt: new Date().toISOString(),
      active: true,
      unsubscribeToken,
    });

    return NextResponse.json(
      { success: true, message: "Subscribed" },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

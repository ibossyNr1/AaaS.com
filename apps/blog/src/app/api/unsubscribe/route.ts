export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return new NextResponse(htmlPage("Missing Token", "No unsubscribe token provided."), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const q = query(
      collection(db, "subscribers"),
      where("unsubscribeToken", "==", token),
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return new NextResponse(htmlPage("Not Found", "This unsubscribe link is invalid or has already been used."), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Set active to false
    for (const doc of snap.docs) {
      await updateDoc(doc.ref, { active: false });
    }

    return new NextResponse(
      htmlPage("Unsubscribed", "You have been successfully unsubscribed from the AaaS Knowledge Index weekly digest. You will no longer receive emails."),
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  } catch {
    return new NextResponse(
      htmlPage("Error", "Something went wrong. Please try again later."),
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — AaaS Knowledge Index</title>
  <style>
    body { margin: 0; padding: 0; background: #080809; color: #ffffff; font-family: 'Inter', -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; max-width: 480px; padding: 40px 24px; }
    h1 { font-size: 24px; margin: 0 0 16px 0; color: #00f3ff; }
    p { font-size: 15px; color: #888888; line-height: 1.6; margin: 0 0 24px 0; }
    a { color: #00f3ff; text-decoration: none; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">Return to AaaS Knowledge Index</a>
  </div>
</body>
</html>`;
}

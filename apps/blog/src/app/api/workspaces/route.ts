import { NextRequest, NextResponse } from "next/server";
import { getUserWorkspaces, createWorkspace } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  try {
    const workspaces = await getUserWorkspaces(userId);
    return NextResponse.json({
      data: workspaces,
      count: workspaces.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, slug, description, plan, settings, logoUrl, theme } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    const workspace = await createWorkspace({
      name,
      slug,
      description: description || "",
      logoUrl,
      theme,
      ownerId: userId,
      plan: plan || "free",
      settings: settings || {
        isPublic: true,
        allowSubmissions: false,
        defaultDigestFrequency: "weekly",
        maxMembers: 5,
      },
    });

    return NextResponse.json({ data: workspace, timestamp: new Date().toISOString() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }
}

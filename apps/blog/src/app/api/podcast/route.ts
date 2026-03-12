export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Episode } from "@/lib/media-types";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function episodeToItem(episode: Episode, index: number): string {
  const link = `https://aaas.blog/listen/${episode.id}`;
  const pubDate = new Date(episode.publishedAt).toUTCString();

  return `    <item>
      <title>${escapeXml(episode.title)}</title>
      <description>${escapeXml(episode.description)}</description>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${escapeXml(episode.audioUrl)}" type="audio/mpeg" />
      <itunes:episode>${index + 1}</itunes:episode>
      <itunes:duration>${formatDuration(episode.duration)}</itunes:duration>
      <itunes:summary>${escapeXml(episode.description)}</itunes:summary>
      <itunes:explicit>false</itunes:explicit>
    </item>`;
}

export async function GET() {
  let episodes: Episode[] = [];

  try {
    const q = query(
      collection(db, "episodes"),
      orderBy("publishedAt", "desc"),
      firestoreLimit(100),
    );
    const snap = await getDocs(q);
    episodes = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Episode);
  } catch {
    // Return empty feed on error
  }

  const lastBuildDate =
    episodes.length > 0
      ? new Date(episodes[0].publishedAt).toUTCString()
      : new Date().toUTCString();

  const items = episodes.map(episodeToItem).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:itunes="http://www.itunes.apple.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>AaaS Knowledge Index Audio</title>
    <link>https://aaas.blog/listen</link>
    <description>AI ecosystem intelligence delivered as audio — narrations, digests, and weekly podcasts</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="https://aaas.blog/api/podcast" rel="self" type="application/rss+xml"/>
    <itunes:author>AaaS Knowledge Index</itunes:author>
    <itunes:summary>AI ecosystem intelligence delivered as audio — narrations, digests, and weekly podcasts</itunes:summary>
    <itunes:category text="Technology"/>
    <itunes:image href="https://aaas.blog/og?title=AaaS%20Audio"/>
    <itunes:explicit>false</itunes:explicit>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

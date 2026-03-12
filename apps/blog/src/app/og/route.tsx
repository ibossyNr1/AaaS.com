import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

const TYPE_COLORS: Record<string, string> = {
  tool: "#00f3ff",
  model: "#939AFF",
  agent: "#F43F6C",
  skill: "#69D4A6",
  script: "#F8D974",
  benchmark: "#55B8FF",
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "AaaS Knowledge Index";
  const type = searchParams.get("type") || "";
  const provider = searchParams.get("provider") || "";
  const score = searchParams.get("score") || "";

  const accentColor = TYPE_COLORS[type] || "#00f3ff";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#080809",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: accentColor,
              }}
            />
            <span
              style={{
                color: "#888",
                fontSize: "20px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              AaaS Knowledge Index
            </span>
          </div>
          {type && (
            <span
              style={{
                color: accentColor,
                fontSize: "18px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                border: `1px solid ${accentColor}`,
                padding: "6px 16px",
                borderRadius: "4px",
              }}
            >
              {type}
            </span>
          )}
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              color: "#ffffff",
              fontSize: title.length > 30 ? "56px" : "72px",
              fontWeight: 700,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {title}
          </h1>
          {provider && (
            <p
              style={{
                color: "#888",
                fontSize: "28px",
                marginTop: "16px",
              }}
            >
              by {provider}
            </p>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #222",
            paddingTop: "24px",
          }}
        >
          <span
            style={{
              color: "#555",
              fontSize: "18px",
              letterSpacing: "0.1em",
            }}
          >
            aaas.blog
          </span>
          {score && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ color: "#555", fontSize: "16px" }}>
                COMPOSITE SCORE
              </span>
              <span
                style={{
                  color: accentColor,
                  fontSize: "32px",
                  fontWeight: 700,
                }}
              >
                {score}
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

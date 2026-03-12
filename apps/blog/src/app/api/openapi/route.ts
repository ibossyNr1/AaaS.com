import { NextResponse } from "next/server";

const entityTypeEnum = ["tool", "model", "agent", "skill", "script", "benchmark"];
const sortEnum = ["composite", "newest", "name"];
const channelExamples = ["llms", "ai-tools", "ai-agents", "ai-code"];
const metricEnum = ["composite", "adoption", "quality", "freshness", "citations", "engagement"];

const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object" as const,
        properties: {
          error: { type: "string" as const },
        },
      },
    },
  },
});

const entitySchema = {
  type: "object" as const,
  properties: {
    slug: { type: "string" as const },
    name: { type: "string" as const },
    type: { type: "string" as const, enum: entityTypeEnum },
    description: { type: "string" as const },
    provider: { type: "string" as const },
    category: { type: "string" as const },
    version: { type: "string" as const },
    pricingModel: { type: "string" as const },
    license: { type: "string" as const },
    url: { type: "string" as const },
    tags: { type: "array" as const, items: { type: "string" as const } },
    capabilities: { type: "array" as const, items: { type: "string" as const } },
    addedDate: { type: "string" as const, format: "date" },
    lastUpdated: { type: "string" as const, format: "date-time" },
    scores: {
      type: "object" as const,
      properties: {
        composite: { type: "number" as const },
        adoption: { type: "number" as const },
        quality: { type: "number" as const },
        freshness: { type: "number" as const },
        citations: { type: "number" as const },
        engagement: { type: "number" as const },
      },
    },
  },
};

const timestampedList = (dataSchema: object) => ({
  type: "object" as const,
  properties: {
    data: { type: "array" as const, items: dataSchema },
    count: { type: "integer" as const },
    timestamp: { type: "string" as const, format: "date-time" },
  },
});

const spec = {
  openapi: "3.0.3",
  info: {
    title: "AaaS Knowledge Index API",
    description:
      "Schema-first AI ecosystem database API. Browse, search, and contribute to the autonomous knowledge index of tools, models, agents, skills, scripts, and benchmarks.",
    version: "1.0.0",
    contact: {
      name: "AaaS",
      url: "https://aaas.blog",
    },
  },
  servers: [{ url: "https://aaas.blog/api" }],
  tags: [
    { name: "Entities", description: "Browse and retrieve entities" },
    { name: "Search", description: "Full-text search across all entity types" },
    { name: "Leaderboard", description: "Ranked entity listings by score" },
    { name: "Submit", description: "Submit new entities for review" },
    { name: "Export", description: "Bulk data export in JSON or CSV" },
    { name: "Trending", description: "Trending alerts and score changes" },
    { name: "Activity", description: "Unified activity feed" },
    { name: "Badge", description: "Embeddable SVG score badges" },
    { name: "Keys", description: "API key registration and management" },
    { name: "Media", description: "Episodes, podcast RSS, and entity RSS feeds" },
  ],
  paths: {
    "/entities": {
      get: {
        tags: ["Entities"],
        summary: "List entities",
        description:
          "Returns entities filtered by type or channel. Defaults to trending entities when no filter is provided.",
        parameters: [
          {
            name: "type",
            in: "query",
            schema: { type: "string", enum: entityTypeEnum },
            description: "Filter by entity type",
          },
          {
            name: "channel",
            in: "query",
            schema: { type: "string" },
            description: `Filter by channel (e.g. ${channelExamples.join(", ")})`,
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50, minimum: 1, maximum: 100 },
            description: "Max results to return",
          },
        ],
        responses: {
          "200": {
            description: "Entity list",
            content: {
              "application/json": {
                schema: timestampedList(entitySchema),
              },
            },
          },
          "500": errorResponse("Server error"),
        },
      },
    },
    "/entity/{type}/{slug}": {
      get: {
        tags: ["Entities"],
        summary: "Get a single entity",
        description: "Retrieve full details for one entity by type and slug.",
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: { type: "string", enum: entityTypeEnum },
            description: "Entity type",
          },
          {
            name: "slug",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Entity slug identifier",
          },
        ],
        responses: {
          "200": {
            description: "Entity details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: entitySchema,
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          "400": errorResponse("Invalid entity type"),
          "404": errorResponse("Entity not found"),
          "500": errorResponse("Server error"),
        },
      },
    },
    "/search": {
      get: {
        tags: ["Search"],
        summary: "Search entities",
        description:
          "Full-text search across entity names, descriptions, providers, and tags.",
        parameters: [
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            description: "Search query",
          },
          {
            name: "type",
            in: "query",
            schema: { type: "string", enum: entityTypeEnum },
            description: "Filter by entity type",
          },
          {
            name: "channel",
            in: "query",
            schema: { type: "string" },
            description: "Filter by channel",
          },
          {
            name: "sort",
            in: "query",
            schema: { type: "string", enum: sortEnum, default: "composite" },
            description: "Sort order",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 100, minimum: 1, maximum: 200 },
            description: "Max results",
          },
        ],
        responses: {
          "200": {
            description: "Search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: entitySchema },
                    count: { type: "integer" },
                    total: { type: "integer" },
                    query: { type: "string", nullable: true },
                    filters: {
                      type: "object",
                      properties: {
                        type: { type: "string", nullable: true },
                        channel: { type: "string", nullable: true },
                        sort: { type: "string" },
                      },
                    },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          "400": errorResponse("Invalid sort parameter"),
          "500": errorResponse("Search failed"),
        },
      },
    },
    "/leaderboard/{category}": {
      get: {
        tags: ["Leaderboard"],
        summary: "Get leaderboard",
        description:
          "Returns top-ranked entities by composite score. Use 'all' for a cross-type leaderboard.",
        parameters: [
          {
            name: "category",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["all", ...entityTypeEnum] },
            description: "Entity type or 'all'",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 25, minimum: 1, maximum: 100 },
            description: "Max results",
          },
        ],
        responses: {
          "200": {
            description: "Leaderboard results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: entitySchema },
                    category: { type: "string" },
                    count: { type: "integer" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          "400": errorResponse("Invalid category"),
          "500": errorResponse("Server error"),
        },
      },
    },
    "/submit": {
      post: {
        tags: ["Submit"],
        summary: "Submit a new entity",
        description:
          "Submit an entity for review. Requires an API key in the x-api-key header.",
        security: [{ apiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "type", "description", "provider", "category"],
                properties: {
                  name: { type: "string", description: "Entity name" },
                  type: {
                    type: "string",
                    enum: entityTypeEnum,
                    description: "Entity type",
                  },
                  description: {
                    type: "string",
                    description: "Short description",
                  },
                  provider: {
                    type: "string",
                    description: "Organization or author",
                  },
                  category: {
                    type: "string",
                    description: "Channel / category slug",
                  },
                  version: { type: "string" },
                  url: { type: "string", format: "uri" },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                  },
                  capabilities: {
                    type: "array",
                    items: { type: "string" },
                  },
                  pricingModel: { type: "string" },
                  license: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Submission accepted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    status: { type: "string", enum: ["pending"] },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "400": errorResponse("Validation error"),
          "401": errorResponse("Missing or invalid API key"),
          "500": errorResponse("Server error"),
        },
      },
    },
    "/export": {
      get: {
        tags: ["Export"],
        summary: "Export entities",
        description: "Bulk export of entity data as JSON or CSV file download.",
        parameters: [
          {
            name: "format",
            in: "query",
            schema: { type: "string", enum: ["json", "csv"], default: "json" },
            description: "Export format",
          },
          {
            name: "type",
            in: "query",
            schema: { type: "string", enum: entityTypeEnum },
            description: "Filter by entity type",
          },
        ],
        responses: {
          "200": {
            description:
              "File download. Content-Type is application/json or text/csv depending on format.",
          },
          "400": errorResponse("Invalid type or format"),
          "500": errorResponse("Export failed"),
        },
      },
    },
    "/trending": {
      get: {
        tags: ["Trending"],
        summary: "Get trending alerts",
        description:
          "Returns the most recent trending score changes detected by autonomous agents.",
        responses: {
          "200": {
            description: "Trending alerts",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      entityName: { type: "string" },
                      entityType: { type: "string" },
                      entitySlug: { type: "string" },
                      direction: {
                        type: "string",
                        enum: ["up", "down"],
                      },
                      delta: { type: "number" },
                      detectedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
          "500": errorResponse("Server error"),
        },
      },
    },
    "/activity": {
      get: {
        tags: ["Activity"],
        summary: "Get activity feed",
        description:
          "Unified feed of agent logs, trending alerts, and submissions sorted by recency.",
        responses: {
          "200": {
            description: "Activity items",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      type: {
                        type: "string",
                        enum: ["agent_log", "trending", "submission"],
                      },
                      timestamp: {
                        type: "string",
                        format: "date-time",
                      },
                      title: { type: "string" },
                      detail: { type: "string" },
                      icon: { type: "string" },
                      entityType: { type: "string" },
                      entitySlug: { type: "string" },
                      success: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
          "500": errorResponse("Server error"),
        },
      },
    },
    "/badge/{type}/{slug}": {
      get: {
        tags: ["Badge"],
        summary: "Get embeddable score badge",
        description:
          "Returns an SVG badge showing the entity score. Embed in README files or dashboards.",
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: { type: "string", enum: entityTypeEnum },
            description: "Entity type",
          },
          {
            name: "slug",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Entity slug",
          },
          {
            name: "metric",
            in: "query",
            schema: {
              type: "string",
              enum: metricEnum,
              default: "composite",
            },
            description: "Score metric to display",
          },
        ],
        responses: {
          "200": {
            description: "SVG badge image",
            content: {
              "image/svg+xml": {
                schema: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/keys": {
      post: {
        tags: ["Keys"],
        summary: "Register a new API key",
        description:
          "Creates a new API key. The raw key is returned only once in the response.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email"],
                properties: {
                  name: {
                    type: "string",
                    minLength: 3,
                    maxLength: 50,
                    description: "Display name for the key",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    description: "Owner email address",
                  },
                  description: {
                    type: "string",
                    description: "Optional description",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Key created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    key: {
                      type: "string",
                      description: "The raw API key (shown only once)",
                    },
                    keyPrefix: { type: "string" },
                    name: { type: "string" },
                    rateLimit: { type: "integer" },
                    createdAt: {
                      type: "string",
                      format: "date-time",
                    },
                  },
                },
              },
            },
          },
          "400": errorResponse("Validation error"),
          "500": errorResponse("Server error"),
        },
      },
      get: {
        tags: ["Keys"],
        summary: "List API keys by email",
        description: "Returns all API keys registered to the given email address.",
        parameters: [
          {
            name: "email",
            in: "query",
            required: true,
            schema: { type: "string", format: "email" },
            description: "Owner email address",
          },
        ],
        responses: {
          "200": {
            description: "Key list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    keys: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          keyPrefix: { type: "string" },
                          name: { type: "string" },
                          status: { type: "string" },
                          requestCount: { type: "integer" },
                          rateLimit: { type: "integer" },
                          createdAt: {
                            type: "string",
                            format: "date-time",
                          },
                          lastUsedAt: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": errorResponse("Missing or invalid email"),
          "500": errorResponse("Server error"),
        },
      },
    },
    "/episodes": {
      get: {
        tags: ["Media"],
        summary: "List audio episodes",
        description:
          "Returns audio episodes (narrations, digests, podcasts) sorted by publish date.",
        parameters: [
          {
            name: "format",
            in: "query",
            schema: {
              type: "string",
              enum: ["narration", "digest", "podcast"],
            },
            description: "Filter by audio format",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50, minimum: 1, maximum: 100 },
            description: "Max results",
          },
        ],
        responses: {
          "200": {
            description: "Episode list",
            content: {
              "application/json": {
                schema: timestampedList({
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    format: {
                      type: "string",
                      enum: ["narration", "digest", "podcast"],
                    },
                    duration: { type: "integer" },
                    audioUrl: { type: "string", format: "uri" },
                    publishedAt: {
                      type: "string",
                      format: "date-time",
                    },
                    tags: {
                      type: "array",
                      items: { type: "string" },
                    },
                    playCount: { type: "integer" },
                  },
                }),
              },
            },
          },
          "500": errorResponse("Server error"),
        },
      },
    },
    "/podcast": {
      get: {
        tags: ["Media"],
        summary: "Podcast RSS feed",
        description:
          "iTunes-compatible RSS feed for podcast clients. Returns XML.",
        responses: {
          "200": {
            description: "RSS XML feed",
            content: {
              "application/xml": {
                schema: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/feed": {
      get: {
        tags: ["Media"],
        summary: "Entity RSS feed",
        description:
          "RSS feed of recently added entities. Subscribe in any feed reader.",
        responses: {
          "200": {
            description: "RSS XML feed",
            content: {
              "application/xml": {
                schema: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "API key obtained via POST /keys",
      },
    },
    schemas: {
      Entity: entitySchema,
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

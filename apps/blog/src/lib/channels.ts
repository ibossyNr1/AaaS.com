import type { Channel } from "./types";

export const CHANNELS: Channel[] = [
  { slug: "llms", name: "LLMs", description: "Large language models, fine-tuning, RAG, and inference", entityCount: 0 },
  { slug: "ai-tools", name: "AI Tools & APIs", description: "Developer tools, SDKs, and API services for AI", entityCount: 0 },
  { slug: "ai-agents", name: "AI Agents", description: "Autonomous agents, assistants, and multi-agent systems", entityCount: 0 },
  { slug: "computer-vision", name: "Computer Vision", description: "Image recognition, generation, video analysis", entityCount: 0 },
  { slug: "prompt-engineering", name: "Prompt Engineering", description: "Prompt design, context engineering, and optimization", entityCount: 0 },
  { slug: "ai-infrastructure", name: "AI Infrastructure", description: "MLOps, training pipelines, deployment, and scaling", entityCount: 0 },
  { slug: "ai-safety", name: "AI Ethics & Safety", description: "Alignment, bias, governance, and responsible AI", entityCount: 0 },
  { slug: "ai-business", name: "AI Business & Strategy", description: "AI adoption, ROI, market trends, and case studies", entityCount: 0 },
  { slug: "ai-code", name: "AI for Code", description: "Code generation, review, debugging, and developer tools", entityCount: 0 },
  { slug: "speech-audio", name: "Speech & Audio AI", description: "TTS, STT, voice cloning, and audio processing", entityCount: 0 },
];

export function getChannel(slug: string): Channel | undefined {
  return CHANNELS.find((c) => c.slug === slug);
}

export function getChannelName(slug: string): string {
  return getChannel(slug)?.name ?? slug;
}

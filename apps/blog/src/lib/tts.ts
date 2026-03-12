/**
 * TTSProvider — pluggable text-to-speech interface.
 *
 * Providers:
 *   - StubTTSProvider: placeholder for dev/testing
 *   - GoogleCloudTTSProvider: Google Cloud Text-to-Speech + Firebase Storage
 *   - ElevenLabsTTSProvider: ElevenLabs API + Firebase Storage
 *
 * Selection: auto-detects from environment variables. Set TTS_PROVIDER=google|elevenlabs|stub
 * to override. Falls back to stub when no credentials are available.
 */

export interface TTSOptions {
  /** Voice identifier (provider-specific) */
  voice?: string;
  /** Speaking rate multiplier (1.0 = normal) */
  speed?: number;
  /** Output format */
  format?: "mp3" | "wav" | "ogg";
}

export interface TTSResult {
  /** URL to the generated audio file */
  audioUrl: string;
  /** Duration in seconds */
  duration: number;
  /** Provider that generated the audio */
  provider: string;
}

export interface TTSProvider {
  name: string;
  /** Generate speech from text */
  synthesize(text: string, options?: TTSOptions): Promise<TTSResult>;
  /** List available voices */
  listVoices(): Promise<{ id: string; name: string; language: string }[]>;
}

// ─── Stub Implementation ─────────────────────────────────────────────

export class StubTTSProvider implements TTSProvider {
  name = "stub";

  async synthesize(text: string): Promise<TTSResult> {
    const wordCount = text.split(/\s+/).length;
    const duration = Math.round((wordCount / 150) * 60);

    return {
      audioUrl: "https://storage.googleapis.com/aaas-platform.appspot.com/audio/placeholder.mp3",
      duration,
      provider: "stub",
    };
  }

  async listVoices() {
    return [
      { id: "narrator-1", name: "Index Narrator", language: "en-US" },
      { id: "host-a", name: "Podcast Host A", language: "en-US" },
      { id: "host-b", name: "Podcast Host B", language: "en-US" },
    ];
  }
}

// ─── Google Cloud TTS Implementation ─────────────────────────────────

export class GoogleCloudTTSProvider implements TTSProvider {
  name = "google-cloud";
  private storageBucket: string;

  constructor(storageBucket = "aaas-platform.appspot.com") {
    this.storageBucket = storageBucket;
  }

  async synthesize(text: string, options?: TTSOptions): Promise<TTSResult> {
    const { TextToSpeechClient } = await import("@google-cloud/text-to-speech");
    const { getStorage } = await import("firebase-admin/storage");

    const client = new TextToSpeechClient();
    const voice = options?.voice || "en-US-Neural2-D";
    const speed = options?.speed || 1.0;

    // Split long text into chunks (5000 byte limit per request)
    const chunks = this.splitText(text, 4500);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      const [response] = await client.synthesizeSpeech({
        input: { text: chunk },
        voice: {
          languageCode: "en-US",
          name: voice,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: speed,
          pitch: 0,
        },
      });

      if (response.audioContent) {
        audioBuffers.push(Buffer.from(response.audioContent as Uint8Array));
      }
    }

    // Concatenate audio buffers
    const fullAudio = Buffer.concat(audioBuffers);

    // Upload to Firebase Storage
    const filename = `audio/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`;
    const bucket = getStorage().bucket(this.storageBucket);
    const file = bucket.file(filename);

    await file.save(fullAudio, {
      metadata: {
        contentType: "audio/mpeg",
        metadata: {
          generatedBy: "aaas-tts",
          provider: this.name,
          voice,
        },
      },
    });

    await file.makePublic();
    const audioUrl = `https://storage.googleapis.com/${this.storageBucket}/${filename}`;

    // Estimate duration from audio size (MP3 ~16kbps for speech)
    const duration = Math.round(fullAudio.length / 2000);

    return { audioUrl, duration, provider: this.name };
  }

  async listVoices() {
    const { TextToSpeechClient } = await import("@google-cloud/text-to-speech");
    const client = new TextToSpeechClient();

    const [response] = await client.listVoices({ languageCode: "en-US" });
    return (response.voices || [])
      .filter((v) => v.name?.includes("Neural2") || v.name?.includes("Studio"))
      .map((v) => ({
        id: v.name || "",
        name: v.name || "",
        language: v.languageCodes?.[0] || "en-US",
      }));
  }

  private splitText(text: string, maxBytes: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let current = "";

    for (const sentence of sentences) {
      if (Buffer.byteLength(current + " " + sentence) > maxBytes) {
        if (current) chunks.push(current.trim());
        current = sentence;
      } else {
        current += (current ? " " : "") + sentence;
      }
    }
    if (current) chunks.push(current.trim());
    return chunks;
  }
}

// ─── ElevenLabs TTS Implementation ───────────────────────────────────

export class ElevenLabsTTSProvider implements TTSProvider {
  name = "elevenlabs";
  private apiKey: string;
  private storageBucket: string;

  constructor(apiKey: string, storageBucket = "aaas-platform.appspot.com") {
    this.apiKey = apiKey;
    this.storageBucket = storageBucket;
  }

  async synthesize(text: string, options?: TTSOptions): Promise<TTSResult> {
    const { getStorage } = await import("firebase-admin/storage");

    const voiceId = options?.voice || "21m00Tcm4TlvDq8ikWAM"; // Rachel
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: options?.speed || 1.0,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Upload to Firebase Storage
    const filename = `audio/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`;
    const bucket = getStorage().bucket(this.storageBucket);
    const file = bucket.file(filename);

    await file.save(audioBuffer, {
      metadata: {
        contentType: "audio/mpeg",
        metadata: {
          generatedBy: "aaas-tts",
          provider: this.name,
          voiceId,
        },
      },
    });

    await file.makePublic();
    const audioUrl = `https://storage.googleapis.com/${this.storageBucket}/${filename}`;
    const duration = Math.round(audioBuffer.length / 2000);

    return { audioUrl, duration, provider: this.name };
  }

  async listVoices() {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": this.apiKey },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.voices || []).map((v: { voice_id: string; name: string }) => ({
      id: v.voice_id,
      name: v.name,
      language: "en-US",
    }));
  }
}

// ─── Provider Factory ────────────────────────────────────────────────

let _provider: TTSProvider | null = null;

/**
 * Auto-detect TTS provider from environment.
 * Priority: TTS_PROVIDER env > ELEVENLABS_API_KEY > GOOGLE_APPLICATION_CREDENTIALS > stub
 */
export function getTTSProvider(): TTSProvider {
  if (_provider) return _provider;

  const explicit = process.env.TTS_PROVIDER;

  if (explicit === "google" || (!explicit && process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    _provider = new GoogleCloudTTSProvider();
    console.log("[TTS] Using Google Cloud TTS provider");
  } else if (explicit === "elevenlabs" || (!explicit && process.env.ELEVENLABS_API_KEY)) {
    _provider = new ElevenLabsTTSProvider(process.env.ELEVENLABS_API_KEY || "");
    console.log("[TTS] Using ElevenLabs TTS provider");
  } else {
    _provider = new StubTTSProvider();
    console.log("[TTS] Using stub TTS provider (no credentials found)");
  }

  return _provider;
}

export function setTTSProvider(provider: TTSProvider): void {
  _provider = provider;
}

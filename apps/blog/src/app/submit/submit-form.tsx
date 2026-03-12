"use client";

import { useState, type FormEvent } from "react";
import { Card, Button, cn } from "@aaas/ui";
import { CHANNELS } from "@/lib/channels";

const ENTITY_TYPES = ["tool", "model", "agent", "skill", "script", "benchmark"] as const;

const labelCx = "text-xs font-mono uppercase tracking-wider text-text-muted";
const inputCx =
  "w-full bg-surface border border-border rounded-lg py-2.5 px-4 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-circuit/50 focus:ring-1 focus:ring-circuit/20 transition-colors";

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function SubmitForm() {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [version, setVersion] = useState("");
  const [license, setLicense] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setType("");
    setDescription("");
    setUrl("");
    setProvider("");
    setCategory("");
    setTags("");
    setVersion("");
    setLicense("");
  }

  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!type) return "Entity type is required.";
    if (!description.trim()) return "Description is required.";
    if (description.trim().length < 20) return "Description must be at least 20 characters.";
    if (!url.trim()) return "URL is required.";
    if (!isValidUrl(url.trim())) return "URL must be a valid URL (include https://).";
    if (!provider.trim()) return "Provider is required.";
    if (!category) return "Category is required.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      type,
      description: description.trim(),
      url: url.trim(),
      provider: provider.trim(),
      category,
    };

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (parsedTags.length > 0) payload.tags = parsedTags;
    if (version.trim()) payload.version = version.trim();
    if (license.trim()) payload.license = license.trim();

    setLoading(true);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "web-form",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 201) {
        setSuccess(`Submission received — ID: ${data.id ?? "pending"}`);
        resetForm();
      } else {
        setError(data.message ?? data.error ?? `Submission failed (${res.status}).`);
      }
    } catch {
      setError("Network error — could not reach the submission API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
        Submit an Entity
      </h2>

      {success && (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 font-mono">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="sf-name" className={labelCx}>
            Name <span className="text-accent-red">*</span>
          </label>
          <input
            id="sf-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cursor"
            className={cn(inputCx, "mt-1.5")}
            required
          />
        </div>

        {/* Type + Category row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="sf-type" className={labelCx}>
              Type <span className="text-accent-red">*</span>
            </label>
            <select
              id="sf-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={cn(inputCx, "mt-1.5 appearance-none")}
              required
            >
              <option value="">Select type...</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sf-category" className={labelCx}>
              Category <span className="text-accent-red">*</span>
            </label>
            <select
              id="sf-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn(inputCx, "mt-1.5 appearance-none")}
              required
            >
              <option value="">Select category...</option>
              {CHANNELS.map((ch) => (
                <option key={ch.slug} value={ch.slug}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="sf-description" className={labelCx}>
            Description <span className="text-accent-red">*</span>{" "}
            <span className="normal-case tracking-normal text-text-muted/60">(min 20 chars)</span>
          </label>
          <textarea
            id="sf-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary of the entity (1-3 sentences)"
            rows={3}
            className={cn(inputCx, "mt-1.5 resize-y")}
            required
            minLength={20}
          />
        </div>

        {/* URL */}
        <div>
          <label htmlFor="sf-url" className={labelCx}>
            URL <span className="text-accent-red">*</span>
          </label>
          <input
            id="sf-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className={cn(inputCx, "mt-1.5")}
            required
          />
        </div>

        {/* Provider */}
        <div>
          <label htmlFor="sf-provider" className={labelCx}>
            Provider <span className="text-accent-red">*</span>
          </label>
          <input
            id="sf-provider"
            type="text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="Organization or author"
            className={cn(inputCx, "mt-1.5")}
            required
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="sf-tags" className={labelCx}>
            Tags{" "}
            <span className="normal-case tracking-normal text-text-muted/60">(comma-separated)</span>
          </label>
          <input
            id="sf-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. code-editor, ai, productivity"
            className={cn(inputCx, "mt-1.5")}
          />
        </div>

        {/* Version + License row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="sf-version" className={labelCx}>
              Version
            </label>
            <input
              id="sf-version"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. 1.0.0"
              className={cn(inputCx, "mt-1.5")}
            />
          </div>

          <div>
            <label htmlFor="sf-license" className={labelCx}>
              License
            </label>
            <input
              id="sf-license"
              type="text"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              placeholder="e.g. MIT, Apache-2.0"
              className={cn(inputCx, "mt-1.5")}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="secondary"
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Submitting..." : "Submit Entity"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

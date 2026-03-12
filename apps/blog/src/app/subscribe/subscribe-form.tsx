"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@aaas/ui";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("You're subscribed! Watch your inbox for the next weekly digest.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-text mb-2">Stay in the loop</h2>
        <p className="text-sm text-text-muted leading-relaxed">
          Weekly digest of AI ecosystem trends, new entities, and agent health reports.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-mono text-circuit uppercase tracking-wider mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={status === "loading"}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-md text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-circuit focus:ring-1 focus:ring-circuit transition-colors disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-2.5 bg-circuit text-basalt-deep font-semibold text-sm rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>
      </form>

      {status === "success" && (
        <div className="mt-4 p-3 rounded-md bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-400 text-center">{message}</p>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400 text-center">{message}</p>
        </div>
      )}
    </Card>
  );
}

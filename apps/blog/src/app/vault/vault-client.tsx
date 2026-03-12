"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Badge, Button, cn } from "@aaas/ui";
import { onAuthChange, type User } from "@/lib/auth";
import { CHANNELS } from "@/lib/channels";
import { VAULT_BASE_URL } from "@/lib/vault";
import type {
  Subscription,
  SubscriptionPlan,
  DigestFrequency,
  AlertPreferences,
} from "@/lib/vault";

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

interface PlanTier {
  id: SubscriptionPlan;
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: PlanTier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    features: [
      "Follow up to 5 channels",
      "Weekly digest emails",
      "Basic entity alerts",
      "Community access",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12/mo",
    highlight: true,
    features: [
      "Unlimited channel follows",
      "Daily + weekly digests",
      "Trending alerts",
      "Priority webhook delivery",
      "API access (1,000 req/day)",
      "Custom alert rules",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    features: [
      "Everything in Pro",
      "Unlimited API access",
      "Custom integrations",
      "SLA guarantees",
      "Dedicated support",
      "Team management",
    ],
  },
];

const FREQUENCIES: { value: DigestFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "none", label: "None" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VaultClient() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auth
  useEffect(() => onAuthChange(setUser), []);

  // Fetch subscription
  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/subscriptions", {
      headers: { "x-user-id": user.uid },
    })
      .then((r) => r.json())
      .then((data) => setSubscription(data.subscription ?? null))
      .catch(() => setSubscription(null))
      .finally(() => setLoading(false));
  }, [user]);

  // Persist changes
  const save = useCallback(
    async (patch: Partial<Subscription>) => {
      if (!user) return;
      setSaving(true);
      try {
        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.uid,
          },
          body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (data.subscription) setSubscription(data.subscription);
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  const saveAlerts = useCallback(
    async (patch: Partial<AlertPreferences>) => {
      if (!user) return;
      setSaving(true);
      try {
        const res = await fetch("/api/subscriptions/alerts", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.uid,
          },
          body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (data.alertPreferences && subscription) {
          setSubscription({ ...subscription, alertPreferences: data.alertPreferences });
        }
      } finally {
        setSaving(false);
      }
    },
    [user, subscription],
  );

  // Toggle channel
  const toggleChannel = useCallback(
    (slug: string) => {
      if (!subscription) return;
      const channels = subscription.channels.includes(slug)
        ? subscription.channels.filter((c) => c !== slug)
        : [...subscription.channels, slug];
      save({ channels });
    },
    [subscription, save],
  );

  // ---------------------------------------------------------------------------
  // Not signed in
  // ---------------------------------------------------------------------------

  if (!user) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <h2 className="text-xl font-semibold text-text mb-3">
          Sign in to access your Vault
        </h2>
        <p className="text-text-muted mb-6 max-w-md mx-auto">
          Connect your AaaS account to manage subscriptions, channel alerts,
          and digest preferences.
        </p>
        <Button variant="primary" onClick={() => import("@/lib/auth").then((m) => m.signInWithGoogle())}>
          Sign in with Google
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-circuit/40 border-t-circuit rounded-full animate-spin" />
      </div>
    );
  }

  const plan = subscription?.plan ?? "free";
  const alerts = subscription?.alertPreferences ?? {
    entityAlerts: true,
    channelAlerts: true,
    weeklyDigest: true,
    trendingAlerts: false,
  };

  return (
    <div className="space-y-10">
      {/* ----------------------------------------------------------------- */}
      {/* Plan comparison */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h2 className="text-2xl font-bold text-text mb-6">Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((tier) => {
            const active = tier.id === plan;
            return (
              <Card
                key={tier.id}
                variant="glass"
                className={cn(
                  "p-6 flex flex-col",
                  tier.highlight && "ring-2 ring-circuit/60",
                  active && "ring-2 ring-accent-red/60",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-text">{tier.name}</h3>
                  {active && <Badge variant="circuit">Current</Badge>}
                </div>
                <p className="text-2xl font-bold text-circuit mb-4">{tier.price}</p>
                <ul className="space-y-2 text-sm text-text-muted flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-circuit mt-0.5">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {!active && tier.id !== "enterprise" && (
                  <Button
                    variant={tier.highlight ? "primary" : "secondary"}
                    className="mt-5 w-full"
                    disabled={saving}
                    onClick={() => save({ plan: tier.id })}
                  >
                    {tier.id === "free" ? "Downgrade" : "Upgrade"}
                  </Button>
                )}
                {!active && tier.id === "enterprise" && (
                  <a
                    href={`${VAULT_BASE_URL}/collaborate`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 block"
                  >
                    <Button variant="secondary" className="w-full">
                      Contact Sales
                    </Button>
                  </a>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Channel subscriptions */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Channel Subscriptions</h2>
        <p className="text-text-muted text-sm mb-5">
          Toggle channels to receive alerts and digest content for those topics.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {CHANNELS.map((ch) => {
            const active = subscription?.channels.includes(ch.slug) ?? false;
            return (
              <button
                key={ch.slug}
                type="button"
                disabled={saving}
                onClick={() => toggleChannel(ch.slug)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-circuit/50 bg-circuit/10 text-text"
                    : "border-border bg-surface/50 text-text-muted hover:border-circuit/30",
                )}
              >
                <span
                  className={cn(
                    "h-5 w-5 rounded-md border flex items-center justify-center text-xs transition-colors",
                    active
                      ? "bg-circuit border-circuit text-basalt-deep"
                      : "border-border",
                  )}
                >
                  {active && "&#10003;"}
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{ch.name}</div>
                  <div className="text-xs text-text-muted truncate">{ch.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Digest frequency */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Digest Frequency</h2>
        <p className="text-text-muted text-sm mb-5">
          How often should we send you a summary of activity across your subscribed channels?
        </p>
        <div className="flex flex-wrap gap-3">
          {FREQUENCIES.map((freq) => {
            const active = (subscription?.digestFrequency ?? "weekly") === freq.value;
            return (
              <button
                key={freq.value}
                type="button"
                disabled={saving}
                onClick={() => save({ digestFrequency: freq.value })}
                className={cn(
                  "rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-circuit bg-circuit/10 text-circuit"
                    : "border-border text-text-muted hover:border-circuit/30",
                )}
              >
                {freq.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Alert preferences */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Alert Preferences</h2>
        <p className="text-text-muted text-sm mb-5">
          Control which notifications you receive from the Knowledge Index.
        </p>
        <div className="space-y-3">
          {([
            { key: "entityAlerts" as const, label: "Entity Alerts", desc: "Get notified when followed entities change" },
            { key: "channelAlerts" as const, label: "Channel Alerts", desc: "New entities added to your subscribed channels" },
            { key: "weeklyDigest" as const, label: "Weekly Digest", desc: "Summary of activity across all channels" },
            { key: "trendingAlerts" as const, label: "Trending Alerts", desc: "Significant score changes and rising entities" },
          ]).map(({ key, label, desc }) => (
            <label
              key={key}
              className="flex items-center justify-between rounded-lg border border-border bg-surface/50 px-4 py-3 cursor-pointer hover:border-circuit/30 transition-colors"
            >
              <div>
                <div className="text-sm font-medium text-text">{label}</div>
                <div className="text-xs text-text-muted">{desc}</div>
              </div>
              <input
                type="checkbox"
                checked={alerts[key]}
                disabled={saving}
                onChange={() => saveAlerts({ [key]: !alerts[key] })}
                className="h-5 w-5 rounded border-border text-circuit focus:ring-circuit accent-[rgb(var(--circuit))]"
              />
            </label>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Platform link */}
      {/* ----------------------------------------------------------------- */}
      <Card variant="glass" className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-text mb-1">Manage Billing on AaaS Platform</h3>
          <p className="text-sm text-text-muted">
            Upgrade, downgrade, or manage payment methods on the main AaaS platform.
          </p>
        </div>
        <a
          href={`${VAULT_BASE_URL}/vault`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="secondary">Open Platform Vault</Button>
        </a>
      </Card>
    </div>
  );
}

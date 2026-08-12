# 0002 — Cost protection for paid-tier Browser Rendering

**Status:** Accepted (2026-08-11)

## Context

The render Worker (ADR-0001) runs on the **free** Browser Rendering tier, where
hitting the daily quota is a harmless `429` hard-stop. The **paid** tier (Workers
Paid) **auto-overages** instead[^paid-pricing] — unbounded spend. We want the
paid tier's headroom without that risk.

Priorities, in order (every trade-off resolves by this list):

1. **Bounded spend** — a ceiling that cannot be exceeded, whatever the traffic.
   Dominates everything below.
2. **(2a) Simplicity / reliability** — fewer moving parts, easy to abandon.
3. **(2b) First share shows an image** — the preview usually exists by share time.
4. **Minimize spend** — $5 ideal, $10 acceptable.
5. **Universal coverage** — every scene eventually gets an image. Sacrificable.

## Decision

**The backend is the sole gatekeeper.** On scene create/edit, inside
`transaction.on_commit`, Django atomically **reserves** a slot from a Postgres
singleton budget row (daily + monthly window, one UTC-rollover-aware
`UPDATE … RETURNING`). Only if granted does it fire a best-effort, secret-gated
render nudge to the Worker (short timeout, no retry). So render count is
hard-bounded: `renders ≤ reservations ≤ cap`. Each granted reservation opens **at
most one** browser session (one `launch`/`close`, no relaunching retry), so
browser-hours follow from the render count.

**Hard duration bound**, two enforcers: one overall `RENDER_DEADLINE ≈ 50 s`
(always `browser.close()`), plus a page-side wall-clock self-halt passed as a
query param so an orphaned session goes CPU-idle even if the Worker dies. With
`keep_alive` off, Cloudflare then idle-closes — making `MAX_SESSION_SECONDS ≈ 120`
a hard bound.[^idle-reap]

**Caps:** `MAX_SPEND` = $10 ⇒ `MONTHLY_CAP` ≈ 1,900, `DAILY_CAP` ≈ 150.[^daily-cap]

**Velocity damper:** the render Worker moves to `screenshots.math3d.org` (a
Workers Custom Domain) with **one zone WAF rate-limiting rule scoped to the
render-trigger request** — free on the zone's single-rule allowance. It bounds a
leaked secret's burn rate so the budget alert can outrun it — not itself a hard
cap.

**Independent tripwire:** a Cloudflare budget alert on Browser Rendering spend,
set to a low threshold.

## Consequences

- Spend through the backend path is bounded at ≤ ~$10/mo regardless of traffic
  (typical ≈ $0); failures there degrade coverage, not spend.[^secret]
- Render-on-create (vs. on fetch) removes crawler-race locking and the existence
  gate — net simpler (serves priority 2a).
- R2 stores one small PNG per scene, growing monotonically; negligible and out of
  scope of the spend bound.
- **Accepted in v1:**
  - No heal for dropped nudges — a scene stays on the default card until next
    edited.
  - A scripted burst can exhaust `DAILY_CAP` coverage.
- **Deferred:** outbox+cron heal (gated on observed drop rate), per-IP throttle,
  Billable-Usage reconciliation, raising `MONTHLY_CAP` after an orphan-close
  measurement.

## Alternatives considered

- **Reserve on the Worker / a Durable Object:** a stateful primitive plus a
  per-render round-trip, for no gain once the backend gatekeeps. Rejected.
- **Transactional outbox + cron as the _primary_ trigger:** ~1 min latency loses
  first-share (2b). Rejected as primary — kept only as the optional heal.
- **Screenshot SaaS / prepaid compute for a native hard cap** (ScreenshotOne,
  Urlbox, bunny.net): pricier than CF Paid and/or more ops, and gives up control
  of the self-imposed cap. Rejected — impose the cap ourselves instead.

[^paid-pricing]:
    Workers Paid is $5/mo, including 10 browser-hours, then
    $0.09/browser-hour thereafter.

[^idle-reap]:
    The Worker-death case assumes Cloudflare idle-reaps a
    `keep_alive`-off, CPU-idle session within ~60 s; confirm empirically in v1.

[^daily-cap]:
    `DAILY_CAP` is an anti-burst damper, not the spend guarantee —
    `MONTHLY_CAP` carries that.

[^secret]:
    Assumes the render secret isn't leaked (true of any secret); reuse an
    existing secret rather than minting a new one.

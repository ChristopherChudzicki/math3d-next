# 0001 — Server-side scene screenshots via a render Worker

**Status:** Accepted (2026-08-11)

## Context

Math3d is a client-rendered SPA with no server-side rendering of scenes. Several
features want a **preview image** of a scene: social unfurls (Open Graph),
thumbnail lists of a user's saved scenes, and curated example galleries.

Scenes draw in MathBox/WebGL in the browser, so the only faithful preview is a
real browser screenshot. A "still mode"[^still-mode] makes a scene
deterministically "done," so the screenshot is reproducible.

Pass-1 already shipped this for OG on the free Browser Rendering tier, but
**lazily**: the Worker renders on cache-miss when a crawler fetches
`GET /og/scene/{key}.png`. This ADR generalizes that pipeline; ADR-0002 changes
the lazy trigger to render-on-create. The endpoint also moves to
`/screenshots/scene/{key}.png`.

## Decision

Treat server-side scene rendering as a **general primitive**, not an OG feature:

- A dedicated Cloudflare Worker loads a scene's still-mode frame route via
  Browser Rendering, screenshots it, and stores a PNG in R2 **keyed by scene**.
- The PNG is served from a keyed endpoint, `GET /screenshots/scene/{key}.png`,
  with a **bounded** cache TTL — `Cache-Control: public, max-age=86400` (24 h)
  today, never `immutable`/indefinite since an edit can change a scene's image.
  The TTL may lengthen (e.g. 7 days) once edits bust caches via a versioned URL
  (see Staleness).[^miss-ttl]
- Renders are triggered on scene create/edit, not lazily on fetch.
- **Consumers:** OG first; saved-scene thumbnails and curated galleries follow,
  off the same keyed PNG.

## Consequences

- One pipeline serves every preview need; a new consumer is just a frontend
  surface pointing an `<img>`/`og:image` at the keyed endpoint. Thumbnails add
  **zero** incremental renders — they reuse the same PNG (downscaled client-side
  if a smaller size is wanted).
- Scenes are public, so serving the image by key needs no auth — an image is no
  more private than its scene. Auth protects only _which scenes are on a user's
  list_ (an authed endpoint returns keys, not images).
- Browser Rendering has real cost on the paid tier → ADR-0002.
- **Staleness:** a scene edited after its render shows an out-of-date preview
  until it re-renders; accepted, addressable later (versioned URL / backfill).
- **Coverage gap:** scenes never (re)saved after launch have no image and fall
  back to the default card.

## Alternatives considered

- **DOM/SVG OG generators** (`@vercel/og`, Satori): cannot render MathBox/WebGL.
  Rejected.

[^miss-ttl]:
    A cache miss (no PNG yet) serves the default card with a short
    `max-age=60`, so the real image replaces it promptly once rendered.

[^still-mode]:
    The app calls `mathbox.stop()` once the scene signals
    `data-scene-ready`.

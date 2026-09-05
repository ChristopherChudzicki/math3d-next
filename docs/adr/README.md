# Architecture Decision Records

Each ADR records **one** decision: its context, the choice, and its consequences.
Format is [Michael Nygard's](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
(Status / Context / Decision / Consequences), with a short _Alternatives
considered_ section where the rejected options matter.

ADRs are numbered, committed alongside the code, and **not edited after
acceptance** — to change a decision, add a new ADR that supersedes the old one.

| #                                                 | Title                                             | Status   |
| ------------------------------------------------- | ------------------------------------------------- | -------- |
| [0001](0001-server-side-scene-screenshots.md)     | Server-side scene screenshots via a render Worker | Accepted |
| [0002](0002-browser-rendering-cost-protection.md) | Cost protection for paid-tier Browser Rendering   | Accepted |
| [0003](0003-sentry-monitoring.md)                 | Sentry monitoring (errors + traces)               | Accepted |
| [0004](0004-oauth-only-authentication.md)         | OAuth-only authentication                         | Accepted |
| [0005](0005-local-google-sign-in-testing.md)      | Exercising Google sign-in in local development    | Accepted |

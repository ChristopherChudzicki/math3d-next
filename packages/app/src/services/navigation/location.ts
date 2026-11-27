import type { RegisteredRouter } from "@tanstack/react-router";

/**
 * The app's location, typed with every route's search params.
 * `ReturnType<typeof useLocation>` looks the same but types `search` as `any`.
 */
export type AppLocation = RegisteredRouter["state"]["location"];

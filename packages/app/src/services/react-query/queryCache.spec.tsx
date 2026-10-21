import React from "react";
import { expect, test, vi } from "vitest";
import * as Sentry from "@sentry/react";
import { renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { ApiError, NetworkError, recordEndpoint } from "@math3d/api";
import { createQueryCache } from "./react-query";

vi.mock("@sentry/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/react")>()),
  captureException: vi.fn(),
}));

const SCENE_PATH = "/v1/scenes/{key}/";

const apiError = (status: number, data: unknown = {}) => {
  const response = new Response(null, { status });
  recordEndpoint(response, { method: "GET", schemaPath: SCENE_PATH });
  return new ApiError(status, data, response);
};

test.each([
  {
    name: "an expected ApiError",
    error: apiError(404),
    captured: null,
  },
  {
    name: "a NetworkError",
    error: new NetworkError("GET", SCENE_PATH, new TypeError()),
    captured: {
      level: "warning",
      fingerprint: ["network", "GET", SCENE_PATH],
      tags: {
        query: "scenes.detail",
        "api.method": "GET",
        "api.path": SCENE_PATH,
      },
    },
  },
  {
    name: "a 500 ApiError",
    error: apiError(500, { sentry_event_id: "abc123" }),
    captured: {
      fingerprint: ["api", "GET", SCENE_PATH, "500"],
      tags: {
        query: "scenes.detail",
        "api.method": "GET",
        "api.path": SCENE_PATH,
        "api.status": "500",
        backend_event_id: "abc123",
      },
    },
  },
  {
    name: "a plain Error",
    error: new Error("boom"),
    captured: { tags: { query: "scenes.detail" } },
  },
])("reports $name by its classification", async ({ error, captured }) => {
  const client = new QueryClient({ queryCache: createQueryCache() });
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () =>
      useQuery({
        queryKey: ["scenes", "detail", "some-key"],
        queryFn: () => Promise.reject(error),
        meta: { expectedErrors: [404] },
        retry: false,
      }),
    { wrapper },
  );

  await waitFor(() => expect(result.current.isError).toBe(true));
  if (captured) {
    expect(Sentry.captureException).toHaveBeenCalledWith(error, captured);
  } else {
    expect(Sentry.captureException).not.toHaveBeenCalled();
  }
});

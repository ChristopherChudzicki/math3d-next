import React from "react";
import { expect, test, vi } from "vitest";
import * as Sentry from "@sentry/react";
import { renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { ApiError } from "@math3d/api";
import { createQueryCache } from "./react-query";

vi.mock("@sentry/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/react")>()),
  captureException: vi.fn(),
}));

const apiError = (status: number) =>
  new ApiError(status, {}, new Response(null, { status }));

test.each([
  { error: apiError(404), expectedErrors: [404], reported: false },
  { error: apiError(404), expectedErrors: undefined, reported: true },
  {
    error: new TypeError("Failed to fetch"),
    expectedErrors: [404],
    reported: true,
  },
])(
  "$error.message (expected: $expectedErrors) reaches Sentry: $reported",
  async ({ error, expectedErrors, reported }) => {
    const client = new QueryClient({ queryCache: createQueryCache() });
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ["scenes", "detail", "some-key"],
          queryFn: () => Promise.reject(error),
          meta: { expectedErrors },
          retry: false,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    if (reported) {
      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: { query: "scenes.detail" },
      });
    } else {
      expect(Sentry.captureException).not.toHaveBeenCalled();
    }
  },
);

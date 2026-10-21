import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  focusManager,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { ApiError, NetworkError } from "@math3d/api";
import { createQueryClient } from "./react-query";

const getWrapper = () => {
  const queryClient = createQueryClient();
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return wrapper;
};

const apiError = (status: number) =>
  new ApiError(status, {}, new Response(null, { status }));

test.each([
  { error: apiError(403), retries: 0 },
  { error: apiError(404), retries: 0 },
  { error: apiError(408), retries: 3 },
  { error: apiError(429), retries: 3 },
  { error: apiError(502), retries: 3 },
  { error: apiError(503), retries: 3 },
  { error: apiError(504), retries: 3 },
  { error: new NetworkError("GET", "/x/", new TypeError()), retries: 3 },
])("should retry $error.message $retries times", async ({ error, retries }) => {
  const wrapper = getWrapper();
  const queryFn = vi.fn().mockRejectedValue(error);
  const { result } = renderHook(
    () =>
      useQuery({
        queryKey: ["test"],
        queryFn,
        retryDelay: 0,
      }),
    { wrapper },
  );

  await waitFor(() => {
    expect(result.current.isError).toBe(true);
  });
  expect(queryFn).toHaveBeenCalledTimes(retries + 1);
});

test("a query that failed with a 500 doesn't refetch on focus", async () => {
  const wrapper = getWrapper();
  const queryFn = vi.fn().mockRejectedValue(apiError(500));
  const { result } = renderHook(
    () => useQuery({ queryKey: ["test"], queryFn }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.isError).toBe(true));

  try {
    await act(async () => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });
    expect(queryFn).toHaveBeenCalledTimes(1);
  } finally {
    focusManager.setFocused(undefined);
  }
});

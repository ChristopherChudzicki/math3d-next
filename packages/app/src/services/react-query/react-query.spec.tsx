import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { createQueryClient } from "./react-query";

const getWrapper = () => {
  const queryClient = createQueryClient();
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return wrapper;
};

test.each([
  { status: 403, retries: 0 },
  { status: 404, retries: 0 },
  { status: 408, retries: 3 },
  { status: 429, retries: 3 },
  { status: 502, retries: 3 },
  { status: 503, retries: 3 },
  { status: 504, retries: 3 },
])(
  "should retry $status failures $retries times",
  async ({ status, retries }) => {
    const wrapper = getWrapper();
    const queryFn = vi.fn().mockRejectedValue({ response: { status } });
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
  },
);

import React from "react";
import { expect, test, vi } from "vitest";
import * as Sentry from "@sentry/react";
import { act, renderHook } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import type { MutationMeta } from "@math3d/api";
import ToastHost from "@/features/toasts/ToastHost";
import { expectToast, screen, waitFor, within } from "@/test_util";
import { createMutationCache, DEFAULT_ERROR_TOAST } from "./react-query";

vi.mock("@sentry/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/react")>()),
  captureException: vi.fn(),
}));

const COPY = "Couldn’t do the thing. Try again.";

const renderMutation = (meta?: MutationMeta) => {
  const client = new QueryClient({ mutationCache: createMutationCache() });
  let fail = true;
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={client}>
      {children}
      <ToastHost />
    </QueryClientProvider>
  );
  const { result } = renderHook(
    () =>
      useMutation({
        meta,
        mutationFn: async () => {
          if (fail) throw new Error("boom");
        },
      }),
    { wrapper },
  );
  const succeedFromNowOn = () => {
    fail = false;
  };
  return { result, succeedFromNowOn };
};

test("a failure without copy toasts the default", async () => {
  const { result } = renderMutation();
  await act(() => result.current.mutateAsync().catch(() => {}));
  await expectToast(DEFAULT_ERROR_TOAST);
});

test("a failure toasts the site's copy, and a later success dismisses it", async () => {
  const { result, succeedFromNowOn } = renderMutation({ errorToast: COPY });
  await act(() => result.current.mutateAsync().catch(() => {}));
  await expectToast(COPY);

  succeedFromNowOn();
  await act(() => result.current.mutateAsync());
  const region = screen.getByRole("region", { name: "Notifications" });
  await waitFor(() => expect(within(region).queryByText(COPY)).toBeNull());
});

test("an opted-out failure shows no toast but still reaches Sentry", async () => {
  const { result } = renderMutation({ errorToast: false });
  await act(() => result.current.mutateAsync().catch(() => {}));
  expect(Sentry.captureException).toHaveBeenCalledWith(
    expect.objectContaining({ message: "boom" }),
  );
  // The toast guard in setupTests fails this test if a toast was shown.
});

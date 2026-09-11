import React from "react";
import { test, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import { mockAuth, seedDb, urls } from "@math3d/mock-api";
import { QueryClientProvider } from "@tanstack/react-query";
import { useUserMe } from "@math3d/api";
import { createQueryClient } from "@/services/react-query/react-query";
import { useAuthStatus } from "./useAuthStatus";

const wrapperFor = (queryClient: ReturnType<typeof createQueryClient>) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const failUserMe = () =>
  server.use(
    http.get(urls.auth.usersMe, () => new HttpResponse(null, { status: 500 })),
  );

test("A me-query that never succeeds settles on unauthenticated", async () => {
  failUserMe();

  const { result } = renderHook(useAuthStatus, {
    wrapper: wrapperFor(createQueryClient()),
  });

  // Not "loading": consumers hide the sign-in affordances during it, and a 500
  // is not retried, so "loading" here would never end.
  await waitFor(() => expect(result.current).toBe("unauthenticated"));
});

test("A me-query that fails after a success keeps the authenticated view", async () => {
  mockAuth.setCurrentUser(seedDb.withUser().id);
  const queryClient = createQueryClient();

  const { result } = renderHook(
    () => ({ query: useUserMe(), status: useAuthStatus() }),
    { wrapper: wrapperFor(queryClient) },
  );
  await waitFor(() => expect(result.current.status).toBe("authenticated"));

  failUserMe();
  await queryClient.invalidateQueries({ queryKey: ["me"] });
  // React Query reports `isError` on a refetch failure while keeping the last
  // data, so the data check has to come first or a blip reads as a logout.
  await waitFor(() => expect(result.current.query.isError).toBe(true));

  expect(result.current.status).toBe("authenticated");
});

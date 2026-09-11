import React from "react";
import { test, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import { urls } from "@math3d/mock-api";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/services/react-query/react-query";
import { useAuthStatus } from "./useAuthStatus";

test("A me-query that never succeeds settles on unauthenticated", async () => {
  server.use(
    http.get(urls.auth.usersMe, () => new HttpResponse(null, { status: 500 })),
  );
  const queryClient = createQueryClient();
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(useAuthStatus, { wrapper });

  // Not "loading": consumers hide the sign-in affordances during it, and a 500
  // is not retried, so "loading" here would never end.
  await waitFor(() => expect(result.current).toBe("unauthenticated"));
});

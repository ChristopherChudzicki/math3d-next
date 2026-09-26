import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { allauthClient, toApiError, unwrap, v1Client } from "../util";
import { isApiError } from "../../util";
import { resetOnAuthChange } from "../queryMeta";

const keys = {
  userMe: ["me"],
};

const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error, response } = await allauthClient.DELETE(
        "/_allauth/browser/v1/auth/session",
      );
      // allauth returns 401 after logout (confirming you're unauthenticated).
      // This is expected behavior, not an error.
      if (response.ok || response.status === 401) return;
      throw toApiError(response, error);
    },
    onSuccess: async () => {
      await resetOnAuthChange(queryClient);
    },
  });
};

/**
 * Fetch the current user's identity.
 *
 * This endpoint seeds the `csrftoken` cookie before its auth gate, so an
 * anonymous visitor's first call is what makes a later state-changing request
 * possible.
 */
const useUserMe = () => {
  return useQuery({
    queryKey: keys.userMe,
    queryFn: async () => {
      const { data, error, response } =
        await v1Client.GET("/v1/auth/users/me/");
      // Key on HTTP status, NOT error-body presence: a 401/403 may carry an
      // empty/unparseable body, in which case openapi-fetch leaves `error`
      // undefined. We must still return null — useAuthStatus reads `undefined`
      // as "loading", which would hide the sign-in UI indefinitely.
      if (response.status === 401 || response.status === 403) return null;
      if (!response.ok) throw toApiError(response, error);
      return data ?? null;
    },
  });
};

const useUserMeDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(v1Client.POST("/v1/auth/users/me/delete/")),
    onSuccess: async () => {
      await resetOnAuthChange(queryClient);
    },
    // Two things answer 403 here: no session, and a session whose CSRF token
    // did not check out (authentication/api_test.py::test_delete_enforces_csrf).
    // Clearing the cache serves both — it moves `useAuthStatus` off
    // "authenticated" when the session is gone, and refetches `users/me`, which
    // seeds `csrftoken`, when it is not.
    onError: async (error) => {
      if (isApiError(error, [403])) {
        await resetOnAuthChange(queryClient);
      }
    },
  });
};

export { useLogout, useUserMe, useUserMeDelete };

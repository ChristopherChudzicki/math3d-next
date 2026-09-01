import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { allauthClient, toApiError, unwrap, v1Client } from "../util";

const keys = {
  userMe: ["me"],
};

type ProviderTokenLogin = {
  provider: string;
  /** Must equal the backend's configured client ID for the provider, or
   * allauth rejects the token with `client_id_mismatch`. */
  client_id: string;
  id_token: string;
};

/**
 * Sign in with an ID token obtained client-side from a social provider.
 *
 * Signup and login are one request: an unseen provider identity creates the
 * account, a known one logs into it. `process` is pinned to "login" because
 * the only alternative, "connect", links a provider to an existing session,
 * which this app never does.
 */
const useProviderTokenLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, client_id, id_token }: ProviderTokenLogin) =>
      unwrap(
        allauthClient.POST("/_allauth/browser/v1/auth/provider/token", {
          body: { provider, process: "login", token: { client_id, id_token } },
        }),
      ),
    onSuccess: async () => {
      await queryClient.resetQueries();
    },
  });
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
      await queryClient.resetQueries();
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
const useUserMe = (opts?: { enabled?: boolean }) => {
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
    ...opts,
  });
};

const useUserMeDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(v1Client.POST("/v1/auth/users/me/delete/")),
    onSuccess: async () => {
      await queryClient.resetQueries();
    },
  });
};

export { useProviderTokenLogin, useLogout, useUserMe, useUserMeDelete };

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { components as AllauthComponents } from "../../generated-allauth";
import type { components as V1Components } from "../../generated-v1";
import { allauthClient, toApiError, unwrap, v1Client } from "../util";

type AllauthSchemas = AllauthComponents["schemas"];
// allauth's `Login` is password + anyOf[username|email|phone]; our deployment
// only accepts email login, so we narrow the request to the supported
// identifier. This narrow stays assignable to the generated union, so an
// upstream reshape that drops the `email` branch surfaces here as a compile
// error (no backend drift-guard needed).
type Login = {
  email: AllauthSchemas["Email"];
  password: AllauthSchemas["Password"];
};
type Signup = AllauthSchemas["Signup"];
type VerifyEmail = AllauthSchemas["VerifyEmail"];
type RequestPassword = AllauthSchemas["RequestPassword"];
type ResetPassword = AllauthSchemas["ResetPassword"];
type ChangePassword =
  AllauthComponents["requestBodies"]["ChangePassword"]["content"]["application/json"];

type DeleteAccountSchema = V1Components["schemas"]["DeleteAccountSchema"];
type UserUpdateSchema = V1Components["schemas"]["UserUpdateSchema"];

const keys = {
  userMe: ["me"],
};

const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Login) =>
      unwrap(
        allauthClient.POST("/_allauth/browser/v1/auth/login", { body: data }),
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
 * Fetch the current user's profile from the custom v1 endpoint.
 * This provides public_nickname which allauth's session endpoint does not.
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

const useCreateUser = () => {
  return useMutation({
    mutationFn: async (data: Signup) => {
      const {
        data: res,
        error,
        response,
      } = await allauthClient.POST("/_allauth/browser/v1/auth/signup", {
        body: data,
      });
      if (response.ok) return res;
      // allauth returns 401 with a verify_email flow when email verification is
      // mandatory — treat that as success. Narrow on the 401 body's literal
      // `status` (AuthenticationResponse) to read typed `data.flows` with no
      // cast; a non-allauth/empty 401 has no such body and falls through to
      // throw (keyed on HTTP status, never on error-body presence).
      if (error?.status === 401) {
        const { flows } = error.data;
        if (flows.some((f) => f.id === "verify_email")) return error;
      }
      throw toApiError(response, error);
    },
  });
};

const useActivateUser = () => {
  return useMutation({
    mutationFn: async (data: VerifyEmail) => {
      const {
        data: res,
        error,
        response,
      } = await allauthClient.POST("/_allauth/browser/v1/auth/email/verify", {
        body: data,
      });
      if (response.ok) return res;
      // allauth returns 401 after successful email verification when the user
      // is not logged in. This is expected — the email is verified, user just
      // needs to log in. Narrow on the body's `status` discriminant (the 401
      // body is AuthenticationResponse), consistent with useCreateUser.
      if (error?.status === 401) return error;
      throw toApiError(response, error);
    },
  });
};

const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: RequestPassword) =>
      unwrap(
        allauthClient.POST("/_allauth/browser/v1/auth/password/request", {
          body: data,
        }),
      ),
  });
};

const useResetPasswordConfirm = () => {
  return useMutation({
    mutationFn: async (data: ResetPassword) => {
      const {
        data: res,
        error,
        response,
      } = await allauthClient.POST("/_allauth/browser/v1/auth/password/reset", {
        body: data,
      });
      if (response.ok) return res;
      // allauth returns 401 after a successful password reset when the user is
      // not logged in (ACCOUNT_LOGIN_ON_PASSWORD_RESET is False). The password
      // has been changed — the user just needs to log in. An invalid/expired
      // key returns 400, so it still surfaces as an error.
      if (error?.status === 401) return error;
      throw toApiError(response, error);
    },
  });
};

const useUserMePatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserUpdateSchema) =>
      unwrap(v1Client.PATCH("/v1/auth/users/me/", { body: data })),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: keys.userMe,
      });
    },
  });
};

const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePassword) =>
      unwrap(
        allauthClient.POST("/_allauth/browser/v1/account/password/change", {
          body: data,
        }),
      ),
  });
};

const useUserMeDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ current_password }: DeleteAccountSchema) =>
      unwrap(
        v1Client.POST("/v1/auth/users/me/delete/", {
          body: { current_password },
        }),
      ),
    onSuccess: async () => {
      await queryClient.resetQueries();
    },
  });
};

export {
  useLogin,
  useLogout,
  useUserMe,
  useCreateUser,
  useActivateUser,
  useResetPassword,
  useResetPasswordConfirm,
  useUserMePatch,
  useUpdatePassword,
  useUserMeDelete,
};

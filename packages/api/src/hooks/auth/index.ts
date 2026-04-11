import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AuthApi } from "../../generated";
import type { PatchedUserRequest } from "../../generated";
import { getConfig } from "../util";
import { deleteUserMe } from "./api";
import type { DeleteUserMeParams } from "./api";
import {
  allAuthLogin,
  allAuthLogout,
  allAuthSignup,
  allAuthVerifyEmail,
  allAuthRequestPasswordReset,
  allAuthResetPassword,
  allAuthChangePassword,
} from "./allauth-api";
import type {
  AllAuthLoginRequest,
  AllAuthSignupRequest,
  AllAuthVerifyEmailRequest,
  AllAuthRequestPasswordResetRequest,
  AllAuthResetPasswordRequest,
  AllAuthChangePasswordRequest,
} from "./allauth-types";

const authApi = new AuthApi(getConfig());

const keys = {
  userMe: ["me"],
};

const useLogin = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: AllAuthLoginRequest) => allAuthLogin(data),
    onSuccess: async () => {
      await client.resetQueries();
    },
  });
};

const useLogout = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await allAuthLogout();
      } catch (err) {
        // allauth returns 401 after logout (confirming you're unauthenticated).
        // This is expected behavior, not an error.
        if (err instanceof AxiosError && err.response?.status === 401) {
          return;
        }
        throw err;
      }
    },
    onSuccess: async () => {
      await client.resetQueries();
    },
  });
};

/**
 * Fetch the current user's profile from the custom DRF endpoint.
 * This provides public_nickname which allauth's session endpoint does not.
 */
const useUserMe = (opts?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: keys.userMe,
    queryFn: async () => {
      try {
        const res = await authApi.authUsersMeRetrieve();
        return res.data;
      } catch (err) {
        // 401/403 means not authenticated — return null instead of erroring
        if (
          err instanceof AxiosError &&
          [401, 403].includes(err.response?.status ?? 0)
        ) {
          return null;
        }
        throw err;
      }
    },
    ...opts,
  });
};

const useCreateUser = () => {
  return useMutation({
    mutationFn: async (data: AllAuthSignupRequest) => {
      try {
        return await allAuthSignup(data);
      } catch (err) {
        // allauth returns 401 with verify_email flow when email verification
        // is mandatory. This is expected — treat it as success.
        if (err instanceof AxiosError && err.response?.status === 401) {
          const responseData = err.response.data as {
            data?: { flows?: Array<{ id: string }> };
          };
          const flows = responseData?.data?.flows ?? [];
          if (flows.some((f) => f.id === "verify_email")) {
            return err.response;
          }
        }
        throw err;
      }
    },
  });
};

const useActivateUser = () => {
  return useMutation({
    mutationFn: async (data: AllAuthVerifyEmailRequest) => {
      try {
        return await allAuthVerifyEmail(data);
      } catch (err) {
        // allauth returns 401 after successful email verification when the
        // user is not logged in. This is expected — the email is verified,
        // user just needs to log in.
        if (err instanceof AxiosError && err.response?.status === 401) {
          return err.response;
        }
        throw err;
      }
    },
  });
};

const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: AllAuthRequestPasswordResetRequest) =>
      allAuthRequestPasswordReset(data),
  });
};

const useResetPasswordConfirm = () => {
  return useMutation({
    mutationFn: (data: AllAuthResetPasswordRequest) =>
      allAuthResetPassword(data),
  });
};

const useUserMePatch = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: PatchedUserRequest) =>
      authApi.authUsersMePartialUpdate({
        PatchedUserRequest: data,
      }),
    onSettled: () => {
      client.invalidateQueries({
        queryKey: keys.userMe,
      });
    },
  });
};

const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (data: AllAuthChangePasswordRequest) =>
      allAuthChangePassword(data),
  });
};

const useUserMeDelete = () => {
  const client = useQueryClient();
  const config = getConfig();
  return useMutation({
    mutationFn: (data: DeleteUserMeParams) =>
      deleteUserMe(data, config.basePath ?? ""),
    onSuccess: async () => {
      await client.resetQueries();
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

export type {
  AllAuthLoginRequest,
  AllAuthSignupRequest,
  AllAuthVerifyEmailRequest,
  AllAuthRequestPasswordResetRequest,
  AllAuthResetPasswordRequest,
  AllAuthChangePasswordRequest,
} from "./allauth-types";

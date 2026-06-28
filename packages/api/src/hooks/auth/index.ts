import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AllauthApi,
  Configuration as AllauthConfiguration,
  FlowIdEnum,
} from "../../generated-allauth";
import type {
  AuthenticationResponse,
  ChangePasswordRequest,
  Login,
  RequestPassword,
  ResetPassword,
  Signup,
  VerifyEmail,
} from "../../generated-allauth";
import { DefaultApi } from "../../generated-v1";
import type { DeleteAccountSchema, UserUpdateSchema } from "../../generated-v1";
import { isAxiosError } from "../../util";
import { getBasePath, getConfig } from "../util";

const authApi = new DefaultApi(getConfig());
// allauth gets its own Configuration (not the v1 one) — the two generated
// Configuration classes are separate types; sharing works only by structural
// luck and would break the moment either gains a private member.
const allauthApi = new AllauthApi(
  new AllauthConfiguration({ basePath: getBasePath() }),
);

const keys = {
  userMe: ["me"],
};

const useLogin = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Login) => allauthApi.login({ Login: data }),
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
        await allauthApi.logout();
      } catch (err) {
        // allauth returns 401 after logout (confirming you're unauthenticated).
        // This is expected behavior, not an error.
        if (isAxiosError(err, [401])) return;
        throw err;
      }
    },
    onSuccess: async () => {
      await client.resetQueries();
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
      try {
        const res = await authApi.authenticationApiGetMe();
        return res.data;
      } catch (err) {
        // 401/403 means not authenticated — return null instead of erroring
        if (isAxiosError(err, [401, 403])) return null;
        throw err;
      }
    },
    ...opts,
  });
};

const useCreateUser = () => {
  return useMutation({
    mutationFn: async (data: Signup) => {
      try {
        return await allauthApi.signup({ Signup: data });
      } catch (err) {
        // allauth returns 401 with a verify_email flow when email verification
        // is mandatory. This is expected — treat it as success.
        if (isAxiosError(err, [401])) {
          const body = err.response?.data as AuthenticationResponse;
          const flows = body?.data?.flows ?? [];
          if (flows.some((f) => f.id === FlowIdEnum.VerifyEmail)) {
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
    mutationFn: async (data: VerifyEmail) => {
      try {
        return await allauthApi.verifyEmail({ VerifyEmail: data });
      } catch (err) {
        // allauth returns 401 after successful email verification when the
        // user is not logged in. This is expected — the email is verified,
        // user just needs to log in.
        if (isAxiosError(err, [401])) return err.response;
        throw err;
      }
    },
  });
};

const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: RequestPassword) =>
      allauthApi.requestPassword({ RequestPassword: data }),
  });
};

const useResetPasswordConfirm = () => {
  return useMutation({
    mutationFn: async (data: ResetPassword) => {
      try {
        return await allauthApi.resetPassword({ ResetPassword: data });
      } catch (err) {
        // allauth returns 401 after a successful password reset when the user
        // is not logged in (ACCOUNT_LOGIN_ON_PASSWORD_RESET is False). The
        // password has been changed — the user just needs to log in. An
        // invalid/expired key returns 400, so it still surfaces as an error.
        if (isAxiosError(err, [401])) return err.response;
        throw err;
      }
    },
  });
};

const useUserMePatch = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: UserUpdateSchema) =>
      authApi.authenticationApiPatchMe({
        UserUpdateSchema: data,
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
    mutationFn: (data: ChangePasswordRequest) =>
      allauthApi.changePassword({ ChangePasswordRequest: data }),
  });
};

const useUserMeDelete = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ current_password }: DeleteAccountSchema) =>
      authApi.authenticationApiDeleteMe({
        DeleteAccountSchema: { current_password },
      }),
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

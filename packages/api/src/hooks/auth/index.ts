import {
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AuthApi, SendEmailResetRequest } from "../../generated";
import type {
  TokenCreateRequest,
  UserCreatePasswordRetypeRequest,
  ActivationRequest,
  PasswordResetConfirmRetypeRequest,
  PatchedUserRequest,
  SetPasswordRetypeRequest,
} from "../../generated";
import { getConfig } from "../util";
import { deleteUser, deleteUserMe } from "./api";
import type { DeleteUserMeParams } from "./api";

const authApi = new AuthApi(getConfig());

const keys = {
  userMe: ["me"],
};

const useLogin = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: TokenCreateRequest) =>
      authApi.authTokenLoginCreate({ TokenCreateRequest: data }),
    onSuccess: (data) => {
      // @ts-expect-error drf-spectacular issue
      const token = data.data.auth_token;
      localStorage.setItem("apiToken", JSON.stringify(token));
      client.resetQueries();
    },
  });
};

const useLogout = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.authTokenLogoutCreate(),
    onSuccess: () => {
      localStorage.removeItem("apiToken");
      client.resetQueries();
    },
  });
};

const useUserMe = (opts?: Pick<UseQueryOptions, "enabled">) => {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => {
      if (!localStorage.getItem("apiToken")) {
        return Promise.resolve(null);
      }
      return authApi.authUsersMeRetrieve().then((res) => res.data);
    },
    ...opts,
  });
};

const useCreateUser = () => {
  return useMutation({
    mutationFn: (data: UserCreatePasswordRetypeRequest) =>
      authApi.authUsersCreate({ UserCreatePasswordRetypeRequest: data }),
  });
};

const useActivateUser = () => {
  return useMutation({
    mutationFn: (data: ActivationRequest) =>
      authApi.authUsersActivationCreate({ ActivationRequest: data }),
  });
};

const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: SendEmailResetRequest) =>
      authApi.authUsersResetPasswordCreate({ SendEmailResetRequest: data }),
  });
};

const useResetPasswordConfirm = () => {
  return useMutation({
    mutationFn: (data: PasswordResetConfirmRetypeRequest) =>
      authApi.authUsersResetPasswordConfirmCreate({
        PasswordResetConfirmRetypeRequest: data,
      }),
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
    mutationFn: (data: SetPasswordRetypeRequest) =>
      authApi.authUsersSetPasswordCreate({
        SetPasswordRetypeRequest: data,
      }),
  });
};

const useUserMeDelete = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: DeleteUserMeParams) => deleteUserMe(data, getConfig()),
    onSuccess: () => {
      localStorage.removeItem("apiToken");
      client.resetQueries();
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
  deleteUser,
  useUserMePatch,
  useUpdatePassword,
  useUserMeDelete,
};

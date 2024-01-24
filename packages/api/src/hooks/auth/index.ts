import { UseQueryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { AuthApi, SendEmailResetRequest } from "../../generated";
import type {
  TokenCreateRequest,
  UserCreatePasswordRetypeRequest,
  ActivationRequest,
  PasswordResetConfirmRetypeRequest,
} from "../../generated";
import { getConfig } from "../util";

const authApi = new AuthApi(getConfig());

const useLogin = () => {
  return useMutation({
    mutationFn: (data: TokenCreateRequest) =>
      authApi.authTokenLoginCreate({ TokenCreateRequest: data }),
    onSuccess: (data) => {
      // @ts-expect-error drf-spectacular issue
      const token = data.data.auth_token;
      localStorage.setItem("apiToken", JSON.stringify(token));
    },
  });
};

const useLogout = () => {
  return useMutation({
    mutationFn: () => authApi.authTokenLogoutCreate(),
    onSuccess: () => {
      localStorage.removeItem("apiToken");
    },
  });
};

const useUserMe = (opts?: Pick<UseQueryOptions, "enabled">) => {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.authUsersMeRetrieve().then((res) => res.data),
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

export {
  useLogin,
  useLogout,
  useUserMe,
  useCreateUser,
  useActivateUser,
  useResetPassword,
  useResetPasswordConfirm,
};

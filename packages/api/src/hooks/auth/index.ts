import { useMutation, useQuery } from "@tanstack/react-query";
import { AuthApi, Configuration } from "../../generated";
import type { TokenCreateRequest } from "../../generated";

const config = new Configuration({
  apiKey: async () => {
    const token = JSON.parse(localStorage.getItem("apiToken") ?? "null");
    return token ? `Token ${token}` : "";
  },
  basePath: import.meta.env.VITE_API_BASE_URL as string,
});

const authApi = new AuthApi(config);

const API_TOKEN_KEY = "apiToken";

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

const useUserMe = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.authUsersMeRetrieve(),
  });
};

export { useLogin, useLogout, useUserMe, API_TOKEN_KEY };

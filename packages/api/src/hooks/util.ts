import { Configuration } from "../generated";

const API_TOKEN_KEY = "apiToken";

const getConfig = () =>
  new Configuration({
    apiKey: () => {
      const token = JSON.parse(localStorage.getItem(API_TOKEN_KEY) ?? "null");
      return token ? `Token ${token}` : "";
    },
    basePath: import.meta.env?.VITE_API_BASE_URL as string,
  });

export { getConfig, API_TOKEN_KEY };

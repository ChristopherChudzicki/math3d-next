import axios from "axios";
import { Configuration } from "../generated";

// Send cookies on all requests (needed for cross-origin session auth)
axios.defaults.withCredentials = true;

// Read CSRF token fresh from cookie before each request
// (Django rotates the token, so it must not be cached at module load)
function getCsrfToken(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : "";
}

axios.interceptors.request.use((config) => {
  config.headers.set("X-CSRFToken", getCsrfToken());
  return config;
});

const getConfig = () =>
  new Configuration({
    basePath: import.meta.env?.VITE_API_BASE_URL as string,
  });

export { getConfig };

import axios from "axios";
import { Configuration } from "../generated";

// Send cookies on all requests (needed for cross-origin session auth)
axios.defaults.withCredentials = true;

// Read CSRF token from cookie before each request.
// The cookie is set with CSRF_COOKIE_DOMAIN so it's readable across subdomains
// (e.g., math3d.localdev:3000 can read cookies set by api.math3d.localdev:8000).
function getCsrfToken(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : "";
}

axios.interceptors.request.use((config) => {
  const token = getCsrfToken();
  if (token) {
    config.headers.set("X-CSRFToken", token);
  }
  return config;
});

const getConfig = () =>
  new Configuration({
    basePath: import.meta.env?.VITE_API_BASE_URL as string,
  });

export { getConfig };

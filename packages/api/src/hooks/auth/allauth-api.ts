/**
 * Axios calls for django-allauth headless browser API endpoints.
 * These are hand-written since we opted not to merge the allauth OpenAPI spec.
 */
import axios from "axios";
import type {
  AllAuthLoginRequest,
  AllAuthSignupRequest,
  AllAuthVerifyEmailRequest,
  AllAuthRequestPasswordResetRequest,
  AllAuthResetPasswordRequest,
  AllAuthChangePasswordRequest,
  AllAuthAuthenticatedResponse,
} from "./allauth-types";

const getAllAuthBaseUrl = () => {
  const apiBase = import.meta.env?.VITE_API_BASE_URL as string;
  return `${apiBase}/_allauth/browser/v1`;
};

export const allAuthLogin = (data: AllAuthLoginRequest) =>
  axios.post<AllAuthAuthenticatedResponse>(
    `${getAllAuthBaseUrl()}/auth/login`,
    data,
  );

export const allAuthLogout = () =>
  axios.delete(`${getAllAuthBaseUrl()}/auth/session`);

export const allAuthSignup = (data: AllAuthSignupRequest) =>
  axios.post<AllAuthAuthenticatedResponse>(
    `${getAllAuthBaseUrl()}/auth/signup`,
    data,
  );

export const allAuthVerifyEmail = (data: AllAuthVerifyEmailRequest) =>
  axios.post<AllAuthAuthenticatedResponse>(
    `${getAllAuthBaseUrl()}/auth/email/verify`,
    data,
  );

export const allAuthRequestPasswordReset = (
  data: AllAuthRequestPasswordResetRequest,
) => axios.post(`${getAllAuthBaseUrl()}/auth/password/request`, data);

export const allAuthResetPassword = (data: AllAuthResetPasswordRequest) =>
  axios.post(`${getAllAuthBaseUrl()}/auth/password/reset`, data);

export const allAuthChangePassword = (data: AllAuthChangePasswordRequest) =>
  axios.post(`${getAllAuthBaseUrl()}/account/password/change`, data);

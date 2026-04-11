/**
 * TypeScript types for django-allauth headless browser API responses.
 * Hand-written since we opted not to merge allauth's OpenAPI spec with the DRF spec.
 */

export interface AllAuthUser {
  id: number;
  display: string;
  email: string;
  has_usable_password: boolean;
}

export interface AllAuthAuthenticationMethod {
  method: string;
  at: number;
  email?: string;
}

export interface AllAuthAuthenticated {
  user: AllAuthUser;
  methods: AllAuthAuthenticationMethod[];
}

export interface AllAuthAuthenticatedResponse {
  status: 200;
  data: AllAuthAuthenticated;
  meta: {
    is_authenticated: true;
  };
}

export interface AllAuthLoginRequest {
  email: string;
  password: string;
}

export interface AllAuthSignupRequest {
  email: string;
  password: string;
  public_nickname?: string;
}

export interface AllAuthVerifyEmailRequest {
  key: string;
}

export interface AllAuthRequestPasswordResetRequest {
  email: string;
}

export interface AllAuthResetPasswordRequest {
  key: string;
  password: string;
}

export interface AllAuthChangePasswordRequest {
  current_password?: string;
  new_password: string;
}

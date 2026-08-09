import type {
  AuthenticatedUserResponse,
  LoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  PasswordResetVerifyRequest,
  PasswordResetVerifyResponse,
  RegisterRequest,
  TokenResponse,
  UserResponse,
} from '@/types';

import { apiClient } from './api-client';
import { clearAccessToken, setAccessToken } from './auth-token-store';

const AUTH_PATH = '/api/v1/auth';

export const authApi = {
  async guest(signal?: AbortSignal) {
    const response = await apiClient.post<TokenResponse>(`${AUTH_PATH}/guest`, undefined, {
      signal,
    });
    await setAccessToken(response.accessToken);
    return response;
  },

  register(request: RegisterRequest, signal?: AbortSignal) {
    return apiClient.post<UserResponse>(`${AUTH_PATH}/register`, request, { signal });
  },

  async login(request: LoginRequest, signal?: AbortSignal) {
    const response = await apiClient.post<TokenResponse>(`${AUTH_PATH}/login`, request, { signal });
    await setAccessToken(response.accessToken);
    return response;
  },

  me(signal?: AbortSignal) {
    return apiClient.get<AuthenticatedUserResponse>(`${AUTH_PATH}/me`, { signal });
  },

  requestPasswordReset(request: PasswordResetRequest, signal?: AbortSignal) {
    return apiClient.post<PasswordResetRequestResponse>(
      `${AUTH_PATH}/password-reset/request`,
      request,
      {
        signal,
      },
    );
  },

  verifyPasswordResetToken(request: PasswordResetVerifyRequest, signal?: AbortSignal) {
    return apiClient.post<PasswordResetVerifyResponse>(
      `${AUTH_PATH}/password-reset/verify`,
      request,
      {
        signal,
      },
    );
  },

  confirmPasswordReset(request: PasswordResetConfirmRequest, signal?: AbortSignal) {
    return apiClient.post<null>(`${AUTH_PATH}/password-reset/confirm`, request, { signal });
  },

  logout() {
    return clearAccessToken();
  },

  async logoutToGuest(signal?: AbortSignal) {
    await clearAccessToken();
    return this.guest(signal);
  },
};

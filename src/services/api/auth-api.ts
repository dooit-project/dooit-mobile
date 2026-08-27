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
import {
  clearSessionCredential,
  getRefreshToken,
  setAuthAccountType,
  setSessionCredential,
} from './auth-token-store';

const AUTH_PATH = '/api/v1/auth';

async function persistTokenResponse(response: TokenResponse) {
  await setSessionCredential({
    accessToken: response.accessToken,
    accessTokenExpiresAt: response.expiresAt,
    refreshToken: response.refreshToken,
    refreshTokenExpiresAt: response.refreshExpiresAt,
  });
  await setAuthAccountType(response.user.accountType);
}

export function isTokenResponse(response: UserResponse | TokenResponse): response is TokenResponse {
  return 'accessToken' in response;
}

export const authApi = {
  async guest(signal?: AbortSignal) {
    const response = await apiClient.post<TokenResponse>(`${AUTH_PATH}/guest`, undefined, {
      signal,
    });
    await persistTokenResponse(response);
    return response;
  },

  async refreshGuest(signal?: AbortSignal) {
    const refreshToken = getRefreshToken();
    const response = await apiClient.post<TokenResponse>(
      `${AUTH_PATH}/guest/refresh`,
      refreshToken ? { refreshToken } : undefined,
      { signal },
    );
    await persistTokenResponse(response);
    return response;
  },

  async register(request: RegisterRequest, signal?: AbortSignal) {
    const response = await apiClient.post<UserResponse | TokenResponse>(
      `${AUTH_PATH}/register`,
      request,
      { signal },
    );
    if (isTokenResponse(response)) {
      await persistTokenResponse(response);
    }
    return response;
  },

  async login(request: LoginRequest, signal?: AbortSignal) {
    const response = await apiClient.post<TokenResponse>(`${AUTH_PATH}/login`, request, { signal });
    await persistTokenResponse(response);
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

  async logout(signal?: AbortSignal) {
    const refreshToken = getRefreshToken();
    try {
      await apiClient.post<null>(
        `${AUTH_PATH}/logout`,
        refreshToken ? { refreshToken } : undefined,
        { signal },
      );
    } finally {
      await clearSessionCredential();
    }
  },

  async logoutToGuest(signal?: AbortSignal) {
    await this.logout(signal);
    return this.guest(signal);
  },
};

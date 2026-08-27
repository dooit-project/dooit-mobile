import type { LocalDateTimeString } from './date-time';

export type UserRole = 'USER' | 'ADMIN';
export type AccountType = 'GUEST' | 'REGISTERED';

export type UserResponse = {
  id: number;
  accountType: AccountType;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  timeZone: string;
  createdAt: LocalDateTimeString;
  updatedAt: LocalDateTimeString | null;
};

export type RegisterRequest = {
  email: string;
  password: string;
  displayName: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type PasswordResetRequest = {
  email: string;
};

export type PasswordResetRequestResponse = {
  requested: boolean;
  ttlSeconds: number;
};

export type PasswordResetVerifyRequest = {
  token: string;
};

export type PasswordResetVerifyResponse = {
  valid: boolean;
  maskedEmail: string | null;
};

export type PasswordResetConfirmRequest = {
  token: string;
  newPassword: string;
};

export type GuestMergeResultResponse = {
  tasks: number;
  schedules: number;
  ddayGoals: number;
  recurrenceSeries: number;
};

export type TokenResponse = {
  tokenType: 'Bearer';
  accessToken: string;
  expiresAt: LocalDateTimeString;
  user: UserResponse;
  mergeResult: GuestMergeResultResponse | null;
};

export type AuthenticatedUserResponse = {
  id: number;
  accountType: AccountType;
  email: string | null;
  displayName: string | null;
  role: UserRole;
};

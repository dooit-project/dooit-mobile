#!/usr/bin/env node

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `mobile-auth-smoke-${runId}@example.com`;
const password = `M-auth-${runId}`;
const displayName = `모바일 인증 스모크 ${runId.slice(-6)}`;

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    signal: controller.signal,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  }).finally(() => clearTimeout(timeoutId));
  const body = await readJsonBody(response);

  if (!response.ok || body?.status === 'fail') {
    const message = body?.error?.message ?? `HTTP ${response.status}`;
    const error = new Error(`${path} failed: ${message}`);
    error.status = response.status;
    error.code = body?.error?.code;
    throw error;
  }

  return body?.data ?? null;
}

async function expectHttpFailure(path, expectedStatus, options = {}) {
  try {
    await request(path, options);
  } catch (error) {
    if (error.status === expectedStatus) {
      return;
    }

    throw error;
  }

  throw new Error(`${path} unexpectedly succeeded`);
}

function assertTokenResponse(token, label = 'token') {
  if (token?.tokenType !== 'Bearer') {
    throw new Error(`${label} tokenType must be Bearer`);
  }
  if (typeof token.accessToken !== 'string' || !token.accessToken) {
    throw new Error(`${label} accessToken missing`);
  }
  if (typeof token.expiresAt !== 'string' || !token.expiresAt) {
    throw new Error(`${label} expiresAt missing`);
  }
  if (typeof token.refreshToken !== 'string' || !token.refreshToken) {
    throw new Error(`${label} refreshToken missing`);
  }
  if (typeof token.refreshExpiresAt !== 'string' || !token.refreshExpiresAt) {
    throw new Error(`${label} refreshExpiresAt missing`);
  }
}

async function readJsonBody(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response from ${apiUrl}. HTTP ${response.status}`);
  }
}

async function main() {
  console.log(`Auth smoke target: ${apiUrl}`);
  console.log(`Auth smoke account: ${email}`);

  const user = await request('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
  if (user.email !== email) {
    throw new Error('register response email mismatch');
  }
  console.log('✓ register');

  const token = await request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assertTokenResponse(token, 'login');
  console.log('✓ login access and refresh credential');

  const refreshedToken = await request('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token.refreshToken }),
  });
  assertTokenResponse(refreshedToken, 'refresh');
  if (refreshedToken.user?.id !== token.user?.id) {
    throw new Error('refresh changed registered user id');
  }
  if (refreshedToken.refreshToken === token.refreshToken) {
    throw new Error('refresh token was not rotated');
  }
  console.log('✓ registered refresh token rotation');

  const me = await request('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${refreshedToken.accessToken}` },
  });
  if (me.email !== email) {
    throw new Error('me response email mismatch');
  }
  console.log('✓ me');

  await expectHttpFailure('/api/v1/auth/me', 401);
  console.log('✓ unauthenticated me rejected');

  await expectHttpFailure('/api/v1/auth/me', 401, {
    headers: { Authorization: 'Bearer invalid-auth-smoke-token' },
  });
  console.log('✓ invalid token rejected');

  await request('/api/v1/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshedToken.accessToken}` },
    body: JSON.stringify({ refreshToken: refreshedToken.refreshToken }),
  });
  await expectHttpFailure('/api/v1/auth/refresh', 401, {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshedToken.refreshToken }),
  });
  console.log('✓ logout revoked the registered refresh session');

  console.log('Auth smoke passed. Token and password were not printed.');
}

if (require.main === module) {
  main().catch((error) => {
    if (error?.name === 'AbortError') {
      console.error(`Auth smoke timed out while connecting to ${apiUrl}`);
    } else {
      console.error(error instanceof Error ? error.message : error);
    }
    process.exitCode = 1;
  });
}

module.exports = { assertTokenResponse };

import { request as httpRequest } from 'node:http';

import type { AuthTokenStorage } from '../auth/auth-storage';
import type { AuthTokens } from '../auth/auth-types';
import { getApiBaseUrl } from '../config/environment';
import { ApiClient } from './api-client';
import { ApiError } from './api-error';
import { AuthApi } from './auth-api';

const integrationEnabled = process.env.RUN_MOBILE_AUTH_INTEGRATION === '1';
const describeIntegration = integrationEnabled ? describe : describe.skip;

const nodeFetch: typeof fetch = (input, init) =>
  new Promise<Response>((resolve, reject) => {
    const requestUrl =
      typeof input === 'string'
        ? new URL(input)
        : input instanceof URL
          ? input
          : new URL(input.url);
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((value, key) => {
      headers[key] = value;
    });
    const request = httpRequest(
      requestUrl,
      { method: init?.method, headers },
      (incomingResponse) => {
        const chunks: Buffer[] = [];
        incomingResponse.on('data', (chunk: Buffer) => chunks.push(chunk));
        incomingResponse.on('end', () => {
          const status = incomingResponse.statusCode ?? 500;
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({
            ok: status >= 200 && status < 300,
            status,
            text: () => Promise.resolve(body),
          } as Response);
        });
      },
    );
    request.on('error', reject);
    if (typeof init?.body === 'string') request.write(init.body);
    request.end();
  });

function createMemoryStorage(): AuthTokenStorage & { current(): AuthTokens | null } {
  let tokens: AuthTokens | null = null;
  return {
    read: () => Promise.resolve(tokens),
    save: (nextTokens) => {
      tokens = nextTokens;
      return Promise.resolve();
    },
    clear: () => {
      tokens = null;
      return Promise.resolve();
    },
    current: () => tokens,
  };
}

async function integrationStep<T>(name: string, operation: Promise<T>): Promise<T> {
  try {
    return await operation;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw new Error(`${name} failed with ${error.statusCode}/${error.code}`);
    }
    throw error;
  }
}

describeIntegration('mobile authentication API integration', () => {
  jest.setTimeout(60_000);

  it('registers, restores, rotates, logs out, logs in, and clears a revoked session', async () => {
    const storage = createMemoryStorage();
    const baseUrl = getApiBaseUrl();
    const client = new ApiClient({
      getBaseUrl: () => baseUrl,
      storage,
      fetchImplementation: nodeFetch,
    });
    const authApi = new AuthApi(client);
    const email = `mobile.test.${Date.now()}@example.com`;
    const password = 'SecurePassword123';

    const registration = await integrationStep(
      'register',
      authApi.register(email, password),
    );
    expect(registration.user.email).toBe(email);
    expect(storage.current()).not.toBeNull();

    const restoredClient = new ApiClient({
      getBaseUrl: () => baseUrl,
      storage,
      fetchImplementation: nodeFetch,
    });
    const restoredApi = new AuthApi(restoredClient);
    await expect(integrationStep('restore', restoredApi.getMe())).resolves.toMatchObject({ email });

    const beforeRotation = storage.current();
    if (!beforeRotation) throw new Error('Expected registered authentication tokens');
    await storage.save({ ...beforeRotation, accessToken: 'forced-expired-access-token' });
    await expect(integrationStep('refresh', restoredApi.getMe())).resolves.toMatchObject({ email });
    expect(storage.current()?.accessToken).not.toBe(beforeRotation.accessToken);
    expect(storage.current()?.refreshToken).not.toBe(beforeRotation.refreshToken);

    await expect(
      authApi.login(email, 'DefinitelyIncorrectPassword'),
    ).rejects.toMatchObject({ code: 'AUTH_INVALID_CREDENTIALS' });

    const activeTokens = storage.current();
    if (!activeTokens) throw new Error('Expected active authentication tokens');
    const logoutResponse = await nodeFetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${activeTokens.accessToken}` },
    });
    expect(logoutResponse.status).toBe(204);
    await expect(restoredApi.getMe()).rejects.toMatchObject({
      code: 'AUTH_INVALID_REFRESH_TOKEN',
    });
    expect(storage.current()).toBeNull();

    const login = await authApi.login(email, password);
    expect(login.user.email).toBe(email);
    await authApi.logout();
    await client.clearSession();
    expect(storage.current()).toBeNull();
  });
});

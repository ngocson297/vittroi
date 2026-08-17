import type { AuthTokenStorage } from '../auth/auth-storage';
import type { AuthTokens } from '../auth/auth-types';
import { ApiClient } from './api-client';
import { ApiError } from './api-error';

const originalTokens: AuthTokens = {
  accessToken: 'old-access',
  refreshToken: 'old-refresh',
  tokenType: 'Bearer',
};

const rotatedTokens: AuthTokens = {
  accessToken: 'new-access',
  refreshToken: 'new-refresh',
  tokenType: 'Bearer',
};

function response(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
  } as Response;
}

function createStorage(initialTokens: AuthTokens | null) {
  let tokens = initialTokens;
  const storage: AuthTokenStorage = {
    read: jest.fn(() => Promise.resolve(tokens)),
    save: jest.fn((nextTokens) => {
      tokens = nextTokens;
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      tokens = null;
      return Promise.resolve();
    }),
  };
  return { storage, current: () => tokens };
}

function requestUrl(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.toString() : input.url;
}

function authorization(init?: RequestInit): string | null {
  return new Headers(init?.headers).get('Authorization');
}

describe('ApiClient refresh behavior', () => {
  it('uses one refresh for concurrent 401 responses and retries every request once', async () => {
    const tokenStorage = createStorage(originalTokens);
    let releaseRefresh: (() => void) | undefined;
    let markRefreshStarted: (() => void) | undefined;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    const refreshStarted = new Promise<void>((resolve) => {
      markRefreshStarted = resolve;
    });
    let refreshCalls = 0;
    let protectedCalls = 0;

    const fetchImplementation = jest.fn(
      async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const url = requestUrl(input);
        if (url.endsWith('/auth/refresh')) {
          refreshCalls += 1;
          markRefreshStarted?.();
          await refreshGate;
          return response(200, rotatedTokens);
        }

        protectedCalls += 1;
        return authorization(init) === 'Bearer new-access'
          ? response(200, { request: protectedCalls })
          : response(401, { code: 'AUTH_INVALID_ACCESS_TOKEN', message: 'Invalid.' });
      },
    );
    const client = new ApiClient({
      getBaseUrl: () => 'http://api.test',
      storage: tokenStorage.storage,
      fetchImplementation: fetchImplementation as typeof fetch,
    });

    const requests = [
      client.request('/protected/a', { authenticated: true }),
      client.request('/protected/b', { authenticated: true }),
      client.request('/protected/c', { authenticated: true }),
    ];
    await refreshStarted;
    expect(refreshCalls).toBe(1);
    releaseRefresh?.();
    await expect(Promise.all(requests)).resolves.toHaveLength(3);

    expect(refreshCalls).toBe(1);
    expect(protectedCalls).toBe(6);
    expect(tokenStorage.current()).toEqual(rotatedTokens);
    expect(tokenStorage.storage.save).toHaveBeenCalledTimes(1);
  });

  it('reuses rotated tokens when a delayed old-token 401 arrives after refresh', async () => {
    const tokenStorage = createStorage(originalTokens);
    let releaseSlowRequest: (() => void) | undefined;
    const slowRequestGate = new Promise<void>((resolve) => {
      releaseSlowRequest = resolve;
    });
    let refreshCalls = 0;
    const fetchImplementation = jest.fn(
      async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const url = requestUrl(input);
        if (url.endsWith('/auth/refresh')) {
          refreshCalls += 1;
          return response(200, rotatedTokens);
        }
        if (url.endsWith('/slow') && authorization(init) === 'Bearer old-access') {
          await slowRequestGate;
        }
        return authorization(init) === 'Bearer new-access'
          ? response(200, { ok: true })
          : response(401, { code: 'AUTH_INVALID_ACCESS_TOKEN', message: 'Invalid.' });
      },
    );
    const client = new ApiClient({
      getBaseUrl: () => 'http://api.test',
      storage: tokenStorage.storage,
      fetchImplementation: fetchImplementation as typeof fetch,
    });

    const slowRequest = client.request('/slow', { authenticated: true });
    await expect(client.request('/fast', { authenticated: true })).resolves.toEqual({
      ok: true,
    });
    releaseSlowRequest?.();
    await expect(slowRequest).resolves.toEqual({ ok: true });
    expect(refreshCalls).toBe(1);
  });

  it('clears auth when refresh is rejected', async () => {
    const tokenStorage = createStorage(originalTokens);
    const onAuthInvalidated = jest.fn();
    const fetchImplementation = jest.fn(
      (input: string | URL | Request): Promise<Response> =>
        Promise.resolve(
          requestUrl(input).endsWith('/auth/refresh')
            ? response(401, { code: 'AUTH_INVALID_REFRESH_TOKEN', message: 'Invalid.' })
            : response(401, { code: 'AUTH_INVALID_ACCESS_TOKEN', message: 'Invalid.' }),
        ),
    );
    const client = new ApiClient({
      getBaseUrl: () => 'http://api.test',
      storage: tokenStorage.storage,
      fetchImplementation: fetchImplementation as typeof fetch,
      onAuthInvalidated,
    });

    await expect(
      client.request('/auth/me', { authenticated: true }),
    ).rejects.toMatchObject({ code: 'AUTH_INVALID_REFRESH_TOKEN' });
    expect(tokenStorage.current()).toBeNull();
    expect(onAuthInvalidated).toHaveBeenCalledTimes(1);
  });

  it('never retries an original request more than once', async () => {
    const tokenStorage = createStorage(originalTokens);
    let protectedCalls = 0;
    let refreshCalls = 0;
    const fetchImplementation = jest.fn(
      (input: string | URL | Request): Promise<Response> => {
        if (requestUrl(input).endsWith('/auth/refresh')) {
          refreshCalls += 1;
          return Promise.resolve(response(200, rotatedTokens));
        }
        protectedCalls += 1;
        return Promise.resolve(
          response(401, { code: 'AUTH_INVALID_ACCESS_TOKEN', message: 'Invalid.' }),
        );
      },
    );
    const client = new ApiClient({
      getBaseUrl: () => 'http://api.test',
      storage: tokenStorage.storage,
      fetchImplementation: fetchImplementation as typeof fetch,
    });

    await expect(
      client.request('/auth/me', { authenticated: true }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(refreshCalls).toBe(1);
    expect(protectedCalls).toBe(2);
  });

  it('does not restore rotated tokens after local logout wins a race', async () => {
    const tokenStorage = createStorage(originalTokens);
    let releaseRefresh: (() => void) | undefined;
    let markRefreshStarted: (() => void) | undefined;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    const refreshStarted = new Promise<void>((resolve) => {
      markRefreshStarted = resolve;
    });
    const fetchImplementation = jest.fn(
      async (input: string | URL | Request): Promise<Response> => {
        if (requestUrl(input).endsWith('/auth/refresh')) {
          markRefreshStarted?.();
          await refreshGate;
          return response(200, rotatedTokens);
        }
        return response(401, { code: 'AUTH_INVALID_ACCESS_TOKEN', message: 'Invalid.' });
      },
    );
    const client = new ApiClient({
      getBaseUrl: () => 'http://api.test',
      storage: tokenStorage.storage,
      fetchImplementation: fetchImplementation as typeof fetch,
    });

    const protectedRequest = client.request('/auth/me', { authenticated: true });
    await refreshStarted;
    await client.clearSession();
    releaseRefresh?.();

    await expect(protectedRequest).rejects.toMatchObject({
      code: 'AUTH_SESSION_CHANGED',
    });
    expect(tokenStorage.current()).toBeNull();
  });
});

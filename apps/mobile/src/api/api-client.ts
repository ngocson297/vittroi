import { ApiError, parseApiError } from './api-error';
import { AUTH_ENDPOINTS } from './endpoints';
import type { AuthTokenStorage } from '../auth/auth-storage';
import type { AuthTokens } from '../auth/auth-types';
import { isAuthTokens } from '../auth/auth-types';

const REQUEST_TIMEOUT_MS = 15_000;

type FetchImplementation = typeof fetch;

interface ApiClientOptions {
  getBaseUrl: () => string;
  storage: AuthTokenStorage;
  fetchImplementation?: FetchImplementation;
  onAuthInvalidated?: () => void;
  timeoutMs?: number;
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  authenticated?: boolean;
  retryAfterRefresh?: boolean;
}

export class ApiClient {
  private readonly fetchImplementation: FetchImplementation;
  private readonly timeoutMs: number;
  private refreshPromise: Promise<AuthTokens> | null = null;
  private sessionGeneration = 0;

  constructor(private readonly options: ApiClientOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  }

  async request(
    path: string,
    requestOptions: ApiRequestOptions = {},
  ): Promise<unknown> {
    const authenticated = requestOptions.authenticated ?? false;
    const retryAfterRefresh = requestOptions.retryAfterRefresh ?? authenticated;
    const requestGeneration = this.sessionGeneration;
    const tokens = authenticated ? await this.options.storage.read() : null;

    if (authenticated && !tokens) {
      await this.invalidateSession();
      throw new ApiError(401, 'AUTH_SESSION_MISSING');
    }

    try {
      return await this.rawRequest(path, requestOptions, tokens?.accessToken);
    } catch (error: unknown) {
      if (
        !(error instanceof ApiError) ||
        error.statusCode !== 401 ||
        !authenticated ||
        !retryAfterRefresh
      ) {
        throw error;
      }
    }

    if (requestGeneration !== this.sessionGeneration) {
      throw new ApiError(401, 'AUTH_SESSION_CHANGED');
    }

    const latestTokens = await this.options.storage.read();
    const refreshedTokens =
      latestTokens && latestTokens.accessToken !== tokens?.accessToken
        ? latestTokens
        : await this.refreshSingleFlight();

    try {
      return await this.rawRequest(
        path,
        { ...requestOptions, retryAfterRefresh: false },
        refreshedTokens.accessToken,
      );
    } catch (error: unknown) {
      if (error instanceof ApiError && error.statusCode === 401) {
        await this.invalidateSession();
      }
      throw error;
    }
  }

  async establishSession(tokens: AuthTokens): Promise<void> {
    const generation = ++this.sessionGeneration;
    await this.options.storage.save(tokens);

    if (generation !== this.sessionGeneration) {
      await this.options.storage.clear();
      throw new ApiError(401, 'AUTH_SESSION_CHANGED');
    }
  }

  readStoredTokens(): Promise<AuthTokens | null> {
    return this.options.storage.read();
  }

  async clearSession(): Promise<void> {
    await this.invalidateSession();
  }

  private async refreshSingleFlight(): Promise<AuthTokens> {
    if (this.refreshPromise) return this.refreshPromise;

    const refresh = this.performRefresh(this.sessionGeneration);
    this.refreshPromise = refresh;

    try {
      return await refresh;
    } finally {
      if (this.refreshPromise === refresh) this.refreshPromise = null;
    }
  }

  private async performRefresh(generation: number): Promise<AuthTokens> {
    const currentTokens = await this.options.storage.read();

    if (!currentTokens) {
      await this.invalidateSession();
      throw new ApiError(401, 'AUTH_SESSION_MISSING');
    }

    try {
      const response = await this.rawRequest(AUTH_ENDPOINTS.refresh, {
        method: 'POST',
        body: { refreshToken: currentTokens.refreshToken },
        authenticated: false,
        retryAfterRefresh: false,
      });

      if (!isAuthTokens(response)) {
        throw new ApiError(502, 'API_INVALID_AUTH_RESPONSE');
      }

      if (generation !== this.sessionGeneration) {
        throw new ApiError(401, 'AUTH_SESSION_CHANGED');
      }

      await this.options.storage.save(response);

      if (generation !== this.sessionGeneration) {
        await this.options.storage.clear();
        throw new ApiError(401, 'AUTH_SESSION_CHANGED');
      }

      return response;
    } catch (error: unknown) {
      if (
        generation === this.sessionGeneration &&
        error instanceof ApiError &&
        (error.statusCode === 401 ||
          error.statusCode === 403 ||
          error.code === 'API_INVALID_AUTH_RESPONSE')
      ) {
        await this.invalidateSession();
      }
      throw error;
    }
  }

  private async invalidateSession(): Promise<void> {
    this.sessionGeneration += 1;
    try {
      await this.options.storage.clear();
    } finally {
      this.options.onAuthInvalidated?.();
    }
  }

  private async rawRequest(
    path: string,
    requestOptions: ApiRequestOptions,
    accessToken?: string,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;

    try {
      response = await this.fetchImplementation(
        `${this.options.getBaseUrl()}${path}`,
        {
          method: requestOptions.method ?? 'GET',
          headers: {
            Accept: 'application/json',
            ...(requestOptions.body === undefined
              ? {}
              : { 'Content-Type': 'application/json' }),
            ...(accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : {}),
          },
          body:
            requestOptions.body === undefined
              ? undefined
              : JSON.stringify(requestOptions.body),
          signal: controller.signal,
        },
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(0, 'REQUEST_TIMEOUT');
      }
      throw new ApiError(0, 'NETWORK_ERROR');
    } finally {
      clearTimeout(timeout);
    }

    const responseText = await response.text();
    let body: unknown = null;

    if (responseText) {
      try {
        body = JSON.parse(responseText) as unknown;
      } catch {
        if (response.ok) throw new ApiError(502, 'API_INVALID_RESPONSE');
      }
    }

    if (!response.ok) throw parseApiError(response.status, body);
    return body;
  }
}

import { ApiClient } from './api-client';
import { ApiError } from './api-error';
import { AUTH_ENDPOINTS } from './endpoints';
import type { AuthResponse, AuthUser } from '../auth/auth-types';
import { isAuthResponse, isAuthUser } from '../auth/auth-types';

function requireAuthResponse(value: unknown): AuthResponse {
  if (!isAuthResponse(value)) {
    throw new ApiError(502, 'API_INVALID_AUTH_RESPONSE');
  }
  return value;
}

function requireAuthUser(value: unknown): AuthUser {
  if (!isAuthUser(value)) {
    throw new ApiError(502, 'API_INVALID_USER_RESPONSE');
  }
  return value;
}

export class AuthApi {
  constructor(private readonly client: ApiClient) {}

  async register(email: string, password: string): Promise<AuthResponse> {
    const response = requireAuthResponse(
      await this.client.request(AUTH_ENDPOINTS.register, {
        method: 'POST',
        body: { email, password },
      }),
    );
    await this.client.establishSession(response);
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = requireAuthResponse(
      await this.client.request(AUTH_ENDPOINTS.login, {
        method: 'POST',
        body: { email, password },
      }),
    );
    await this.client.establishSession(response);
    return response;
  }

  async getMe(): Promise<AuthUser> {
    return requireAuthUser(
      await this.client.request(AUTH_ENDPOINTS.me, { authenticated: true }),
    );
  }

  async logout(): Promise<void> {
    await this.client.request(AUTH_ENDPOINTS.logout, {
      method: 'POST',
      authenticated: true,
    });
  }
}

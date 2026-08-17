export type AuthUserStatus = 'ACTIVE' | 'INACTIVE';

export interface AuthUser {
  id: string;
  email: string;
  status: AuthUserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAuthUserStatus(value: unknown): value is AuthUserStatus {
  return value === 'ACTIVE' || value === 'INACTIVE';
}

export function isAuthUser(value: unknown): value is AuthUser {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    isAuthUserStatus(value.status) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

export function isAuthTokens(value: unknown): value is AuthTokens {
  if (!isRecord(value)) return false;

  return (
    typeof value.accessToken === 'string' &&
    value.accessToken.length > 0 &&
    typeof value.refreshToken === 'string' &&
    value.refreshToken.length > 0 &&
    value.tokenType === 'Bearer'
  );
}

export function isAuthResponse(value: unknown): value is AuthResponse {
  return isRecord(value) && isAuthTokens(value) && isAuthUser(value.user);
}

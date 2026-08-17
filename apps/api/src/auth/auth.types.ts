import { UserStatus } from '../generated/prisma/client';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  sid: string;
  jti: string;
}

export type AuthenticatedPrincipal = AccessTokenClaims;

export interface PublicUser {
  id: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
}

export interface AuthResponse extends AuthTokens {
  user: PublicUser;
}

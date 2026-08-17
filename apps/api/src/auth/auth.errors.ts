import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

function errorBody(statusCode: number, code: string, message: string) {
  return { statusCode, code, message };
}

export function emailAlreadyExists(): ConflictException {
  return new ConflictException(
    errorBody(
      409,
      'AUTH_EMAIL_ALREADY_EXISTS',
      'An account with this email already exists.',
    ),
  );
}

export function invalidCredentials(): UnauthorizedException {
  return new UnauthorizedException(
    errorBody(401, 'AUTH_INVALID_CREDENTIALS', 'Incorrect email or password.'),
  );
}

export function inactiveAccount(): ForbiddenException {
  return new ForbiddenException(
    errorBody(403, 'AUTH_ACCOUNT_INACTIVE', 'Account is inactive.'),
  );
}

export function invalidRefreshToken(): UnauthorizedException {
  return new UnauthorizedException(
    errorBody(401, 'AUTH_INVALID_REFRESH_TOKEN', 'Refresh token is invalid.'),
  );
}

export function invalidAccessToken(): UnauthorizedException {
  return new UnauthorizedException(
    errorBody(401, 'AUTH_INVALID_ACCESS_TOKEN', 'Access token is invalid.'),
  );
}

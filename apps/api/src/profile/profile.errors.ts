import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

function errorBody(statusCode: number, code: string, message: string) {
  return { statusCode, code, message };
}

export function profileAlreadyExists(): ConflictException {
  return new ConflictException(
    errorBody(409, 'PROFILE_ALREADY_EXISTS', 'Mother profile already exists.'),
  );
}

export function profileNotFound(): NotFoundException {
  return new NotFoundException(
    errorBody(404, 'PROFILE_NOT_FOUND', 'Mother profile was not found.'),
  );
}

export function invalidProfileInput(message: string): BadRequestException {
  return new BadRequestException(
    errorBody(400, 'PROFILE_INVALID_INPUT', message),
  );
}

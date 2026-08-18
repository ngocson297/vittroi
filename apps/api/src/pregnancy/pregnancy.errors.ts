import { BadRequestException, ConflictException } from '@nestjs/common';

function errorBody(statusCode: number, code: string, message: string) {
  return { statusCode, code, message };
}

export function profileRequired(): ConflictException {
  return new ConflictException(
    errorBody(
      409,
      'PROFILE_REQUIRED',
      'Complete the mother profile before creating a pregnancy.',
    ),
  );
}

export function activePregnancyAlreadyExists(): ConflictException {
  return new ConflictException(
    errorBody(
      409,
      'ACTIVE_PREGNANCY_ALREADY_EXISTS',
      'An active pregnancy already exists.',
    ),
  );
}

export function invalidDueDate(): BadRequestException {
  return new BadRequestException(
    errorBody(
      400,
      'PREGNANCY_INVALID_DUE_DATE',
      'Due date must be from 21 days ago through 300 days from today.',
    ),
  );
}

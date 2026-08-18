import { ValidateBy, ValidationOptions } from 'class-validator';
import {
  isDateOfBirthInRange,
  isDateOnly,
  isOnboardingDueDateInRange,
} from './date-only';

export function IsDateOnly(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isDateOnly',
      validator: {
        validate: isDateOnly,
        defaultMessage: () =>
          'must be a valid calendar date in YYYY-MM-DD format',
      },
    },
    validationOptions,
  );
}

export function IsDateOfBirth(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isDateOfBirth',
      validator: {
        validate: (value: unknown) => isDateOfBirthInRange(value),
        defaultMessage: () =>
          'must be a valid YYYY-MM-DD date from 1900-01-01 through today',
      },
    },
    validationOptions,
  );
}

export function IsOnboardingDueDate(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isOnboardingDueDate',
      validator: {
        validate: (value: unknown) => isOnboardingDueDateInRange(value),
        defaultMessage: () =>
          'must be a valid YYYY-MM-DD date from 21 days ago through 300 days from today',
      },
    },
    validationOptions,
  );
}

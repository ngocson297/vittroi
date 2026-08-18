const DATE_ONLY_PATTERN = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/;

export const MINIMUM_DATE_OF_BIRTH = '1900-01-01';
export const MINIMUM_DUE_DATE_OFFSET_DAYS = -21;
export const MAXIMUM_DUE_DATE_OFFSET_DAYS = 300;

interface DateOnlyParts {
  year: number;
  month: number;
  day: number;
}

function parseDateOnlyParts(value: string): DateOnlyParts | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  const year = Number(match?.groups?.year);
  const month = Number(match?.groups?.month);
  const day = Number(match?.groups?.day);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1
  ) {
    return null;
  }

  return { year, month, day };
}

export function parseDateOnly(value: string): Date | null {
  const parts = parseDateOnlyParts(value);

  if (!parts) {
    return null;
  }

  const date = new Date(Date.UTC(2000, 0, 1));
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);

  if (
    date.getUTCFullYear() !== parts.year ||
    date.getUTCMonth() !== parts.month - 1 ||
    date.getUTCDate() !== parts.day
  ) {
    return null;
  }

  return date;
}

export function isDateOnly(value: unknown): value is string {
  return typeof value === 'string' && parseDateOnly(value) !== null;
}

export function serializeDateOnly(value: Date): string {
  if (Number.isNaN(value.getTime())) {
    throw new RangeError(
      'Cannot serialize an invalid Date as a date-only value.',
    );
  }

  const year = value.getUTCFullYear().toString().padStart(4, '0');
  const month = (value.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = value.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function localTodayDateOnly(now: Date = new Date()): string {
  const year = now.getFullYear().toString().padStart(4, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDateOnlyDays(value: string, days: number): string {
  const date = parseDateOnly(value);

  if (!date || !Number.isInteger(days)) {
    throw new RangeError(
      'A valid date-only value and integer day offset are required.',
    );
  }

  date.setUTCDate(date.getUTCDate() + days);
  return serializeDateOnly(date);
}

export function isDateOfBirthInRange(
  value: unknown,
  now: Date = new Date(),
): value is string {
  if (!isDateOnly(value)) {
    return false;
  }

  const today = localTodayDateOnly(now);
  return value >= MINIMUM_DATE_OF_BIRTH && value <= today;
}

export function isOnboardingDueDateInRange(
  value: unknown,
  now: Date = new Date(),
): value is string {
  if (!isDateOnly(value)) {
    return false;
  }

  const today = localTodayDateOnly(now);
  const minimum = addDateOnlyDays(today, MINIMUM_DUE_DATE_OFFSET_DAYS);
  const maximum = addDateOnlyDays(today, MAXIMUM_DUE_DATE_OFFSET_DAYS);
  return value >= minimum && value <= maximum;
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const VIETNAMESE_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const MILLISECONDS_PER_DAY = 86_400_000;
const ESTIMATED_PREGNANCY_DAYS = 280;

interface DateParts {
  year: number;
  month: number;
  day: number;
}

export interface PregnancyProgress {
  gestationalWeeks: number;
  gestationalDays: number;
  totalGestationalDays: number;
  daysUntilDueDate: number;
}

function validParts(year: number, month: number, day: number): DateParts | null {
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function parseDateOnly(dateOnly: string): DateParts | null {
  const match = DATE_ONLY_PATTERN.exec(dateOnly);
  if (!match) return null;
  return validParts(Number(match[1]), Number(match[2]), Number(match[3]));
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function toDateOnly(parts: DateParts): string {
  return `${parts.year.toString().padStart(4, '0')}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function isValidDateOnly(dateOnly: string): boolean {
  return parseDateOnly(dateOnly) !== null;
}

export function localDateToDateOnly(date: Date): string {
  return toDateOnly({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

export function dateOnlyToDayNumber(dateOnly: string): number {
  const parts = parseDateOnly(dateOnly);
  if (!parts) throw new Error(`Invalid date-only value: ${dateOnly}`);
  return Date.UTC(parts.year, parts.month - 1, parts.day) / MILLISECONDS_PER_DAY;
}

export function calendarDayDifference(from: string, to: string): number {
  return dateOnlyToDayNumber(to) - dateOnlyToDayNumber(from);
}

export function formatDateOnly(dateOnly: string): string {
  const parts = parseDateOnly(dateOnly);
  if (!parts) throw new Error(`Invalid date-only value: ${dateOnly}`);
  return `${pad(parts.day)}/${pad(parts.month)}/${parts.year.toString().padStart(4, '0')}`;
}

export function formatVietnameseDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function vietnameseDateToDateOnly(value: string): string | null {
  const match = VIETNAMESE_DATE_PATTERN.exec(value);
  if (!match) return null;
  const parts = validParts(Number(match[3]), Number(match[2]), Number(match[1]));
  return parts ? toDateOnly(parts) : null;
}

export function calculatePregnancyProgress(
  dueDate: string,
  today: Date = new Date(),
): PregnancyProgress {
  const todayDateOnly = localDateToDateOnly(today);
  const daysUntilDueDate = calendarDayDifference(todayDateOnly, dueDate);
  const totalGestationalDays = Math.max(
    0,
    ESTIMATED_PREGNANCY_DAYS - daysUntilDueDate,
  );

  return {
    gestationalWeeks: Math.floor(totalGestationalDays / 7),
    gestationalDays: totalGestationalDays % 7,
    totalGestationalDays,
    daysUntilDueDate,
  };
}

export function formatPregnancyAge(progress: PregnancyProgress): string {
  return `${progress.gestationalWeeks} tuần ${progress.gestationalDays} ngày`;
}

export function formatDueDateMessage(daysUntilDueDate: number): string {
  if (daysUntilDueDate > 0) {
    return `Còn ${daysUntilDueDate} ngày đến ngày dự sinh`;
  }
  if (daysUntilDueDate === 0) return 'Hôm nay là ngày dự sinh';
  return `Đã qua ngày dự sinh ${Math.abs(daysUntilDueDate)} ngày`;
}

export function validateDateOfBirthInput(
  value: string,
  today: Date = new Date(),
): string | null {
  if (!value) return 'Vui lòng nhập ngày sinh.';
  const dateOnly = vietnameseDateToDateOnly(value);
  if (!dateOnly) return 'Ngày sinh chưa hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY.';
  if (dateOnly < '1900-01-01') return 'Ngày sinh phải từ 01/01/1900 trở đi.';
  if (dateOnly > localDateToDateOnly(today)) return 'Ngày sinh không thể ở tương lai.';
  return null;
}

export function validateDueDateInput(
  value: string,
  today: Date = new Date(),
): string | null {
  if (!value) return 'Vui lòng nhập ngày dự sinh.';
  const dateOnly = vietnameseDateToDateOnly(value);
  if (!dateOnly) {
    return 'Ngày dự sinh chưa hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY.';
  }
  const difference = calendarDayDifference(localDateToDateOnly(today), dateOnly);
  if (difference < -21 || difference > 300) {
    return 'Ngày dự sinh cần nằm trong khoảng 21 ngày trước đến 300 ngày tới.';
  }
  return null;
}

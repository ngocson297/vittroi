import {
  addDateOnlyDays,
  isDateOfBirthInRange,
  isDateOnly,
  isOnboardingDueDateInRange,
  localTodayDateOnly,
  parseDateOnly,
  serializeDateOnly,
} from './date-only';

describe('date-only utilities', () => {
  const localNoon = new Date(2026, 7, 18, 12, 0, 0);

  it('strictly parses real YYYY-MM-DD calendar dates', () => {
    expect(isDateOnly('2024-02-29')).toBe(true);
    expect(isDateOnly('2023-02-29')).toBe(false);
    expect(isDateOnly('2026-13-01')).toBe(false);
    expect(isDateOnly('2026-01-32')).toBe(false);
    expect(isDateOnly('2026-1-01')).toBe(false);
    expect(isDateOnly('2026-01-01T00:00:00.000Z')).toBe(false);
    expect(isDateOnly(null)).toBe(false);
  });

  it('round-trips through UTC without shifting the calendar date', () => {
    const parsed = parseDateOnly('2026-10-12');

    expect(parsed?.toISOString()).toBe('2026-10-12T00:00:00.000Z');
    expect(serializeDateOnly(parsed as Date)).toBe('2026-10-12');
    expect(serializeDateOnly(new Date(Date.UTC(2026, 9, 12, 23, 59)))).toBe(
      '2026-10-12',
    );
  });

  it('uses an inclusive, deterministic birth-date domain range', () => {
    expect(localTodayDateOnly(localNoon)).toBe('2026-08-18');
    expect(isDateOfBirthInRange('1900-01-01', localNoon)).toBe(true);
    expect(isDateOfBirthInRange('1899-12-31', localNoon)).toBe(false);
    expect(isDateOfBirthInRange('2026-08-18', localNoon)).toBe(true);
    expect(isDateOfBirthInRange('2026-08-19', localNoon)).toBe(false);
  });

  it('uses inclusive due-date boundaries of today -21 through today +300', () => {
    expect(isOnboardingDueDateInRange('2026-07-28', localNoon)).toBe(true);
    expect(isOnboardingDueDateInRange('2026-07-27', localNoon)).toBe(false);
    expect(isOnboardingDueDateInRange('2027-06-14', localNoon)).toBe(true);
    expect(isOnboardingDueDateInRange('2027-06-15', localNoon)).toBe(false);
  });

  it('adds calendar days safely across month, leap-year, and year boundaries', () => {
    expect(addDateOnlyDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDateOnlyDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDateOnlyDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDateOnlyDays('2027-01-01', -1)).toBe('2026-12-31');
  });
});

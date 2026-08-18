import {
  calculatePregnancyProgress,
  calendarDayDifference,
  formatDateOnly,
  formatDueDateMessage,
  formatPregnancyAge,
  formatVietnameseDateInput,
  localDateToDateOnly,
  validateDateOfBirthInput,
  validateDueDateInput,
  vietnameseDateToDateOnly,
} from './date-only';

describe('date-only utilities', () => {
  const today = new Date(2026, 7, 18, 23, 45, 0);

  it('converts local calendar dates without UTC date shifting', () => {
    expect(localDateToDateOnly(today)).toBe('2026-08-18');
    expect(formatDateOnly('1995-08-21')).toBe('21/08/1995');
    expect(vietnameseDateToDateOnly('21/08/1995')).toBe('1995-08-21');
  });

  it('formats controlled Vietnamese date input and rejects invalid calendar dates', () => {
    expect(formatVietnameseDateInput('21081995')).toBe('21/08/1995');
    expect(formatVietnameseDateInput('21 / 08 / 1995 extra')).toBe('21/08/1995');
    expect(vietnameseDateToDateOnly('29/02/2024')).toBe('2024-02-29');
    expect(vietnameseDateToDateOnly('29/02/2023')).toBeNull();
    expect(vietnameseDateToDateOnly('31/04/2026')).toBeNull();
  });

  it('uses calendar-day arithmetic across month and year boundaries', () => {
    expect(calendarDayDifference('2026-02-28', '2026-03-01')).toBe(1);
    expect(calendarDayDifference('2026-12-31', '2027-01-01')).toBe(1);
    expect(calendarDayDifference('2027-01-01', '2026-12-31')).toBe(-1);
  });

  it('calculates exact 40 weeks on the due date', () => {
    const progress = calculatePregnancyProgress('2026-08-18', today);
    expect(progress).toEqual({
      gestationalWeeks: 40,
      gestationalDays: 0,
      totalGestationalDays: 280,
      daysUntilDueDate: 0,
    });
    expect(formatPregnancyAge(progress)).toBe('40 tuần 0 ngày');
  });

  it('calculates 32 weeks and 1 day from a fixed due date', () => {
    expect(calculatePregnancyProgress('2026-10-12', today)).toEqual({
      gestationalWeeks: 32,
      gestationalDays: 1,
      totalGestationalDays: 225,
      daysUntilDueDate: 55,
    });
  });

  it('clamps a pre-conception estimate while preserving days until due', () => {
    expect(calculatePregnancyProgress('2027-06-14', today)).toEqual({
      gestationalWeeks: 0,
      gestationalDays: 0,
      totalGestationalDays: 0,
      daysUntilDueDate: 300,
    });
  });

  it('renders pre-due, due-today, and post-due copy without negative remaining days', () => {
    expect(formatDueDateMessage(56)).toBe('Còn 56 ngày đến ngày dự sinh');
    expect(formatDueDateMessage(0)).toBe('Hôm nay là ngày dự sinh');
    expect(formatDueDateMessage(-1)).toBe('Đã qua ngày dự sinh 1 ngày');
  });

  it('validates DOB domain boundaries and future dates', () => {
    expect(validateDateOfBirthInput('01/01/1900', today)).toBeNull();
    expect(validateDateOfBirthInput('31/12/1899', today)).toContain('01/01/1900');
    expect(validateDateOfBirthInput('19/08/2026', today)).toBe(
      'Ngày sinh không thể ở tương lai.',
    );
    expect(validateDateOfBirthInput('31/02/1995', today)).toContain('chưa hợp lệ');
  });

  it('validates inclusive due-date boundaries', () => {
    expect(validateDueDateInput('28/07/2026', today)).toBeNull();
    expect(validateDueDateInput('14/06/2027', today)).toBeNull();
    expect(validateDueDateInput('27/07/2026', today)).toContain('21 ngày trước');
    expect(validateDueDateInput('15/06/2027', today)).toContain('300 ngày tới');
  });
});

import { validateFullName } from './profile-validation';

describe('mother profile validation', () => {
  it('accepts Vietnamese Unicode and surrounding whitespace is handled by submit', () => {
    expect(validateFullName('  Nguyễn Thị Ánh  ')).toBeNull();
  });

  it('rejects empty and excessively long names', () => {
    expect(validateFullName('   ')).toBe('Vui lòng nhập họ và tên.');
    expect(validateFullName('A')).toBeNull();
    expect(validateFullName('A'.repeat(201))).toContain('200');
  });
});

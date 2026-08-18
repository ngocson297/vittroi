export function validateFullName(fullName: string): string | null {
  const trimmed = fullName.trim();
  if (!trimmed) return 'Vui lòng nhập họ và tên.';
  if (trimmed.length > 200) return 'Họ và tên không được vượt quá 200 ký tự.';
  return null;
}

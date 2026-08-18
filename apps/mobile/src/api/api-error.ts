const FALLBACK_MESSAGE = 'Đã có lỗi xảy ra. Vui lòng thử lại.';

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string = FALLBACK_MESSAGE,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseApiError(statusCode: number, body: unknown): ApiError {
  if (!isRecord(body)) {
    return new ApiError(statusCode, 'API_UNEXPECTED_ERROR');
  }

  const code = typeof body.code === 'string' ? body.code : 'API_UNEXPECTED_ERROR';
  const message = typeof body.message === 'string' ? body.message : FALLBACK_MESSAGE;

  return new ApiError(statusCode, code, message);
}

export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'AUTH_INVALID_CREDENTIALS':
        return 'Email hoặc mật khẩu không đúng.';
      case 'AUTH_ACCOUNT_INACTIVE':
        return 'Tài khoản hiện không hoạt động.';
      case 'AUTH_EMAIL_ALREADY_EXISTS':
        return 'Email này đã được sử dụng.';
      case 'PROFILE_ALREADY_EXISTS':
        return 'Hồ sơ của bạn đã được tạo trước đó.';
      case 'PROFILE_REQUIRED':
        return 'Vui lòng hoàn tất thông tin của mẹ trước.';
      case 'PROFILE_NOT_FOUND':
        return 'Không tìm thấy hồ sơ của bạn.';
      case 'ACTIVE_PREGNANCY_ALREADY_EXISTS':
        return 'Bạn đã có một thai kỳ đang hoạt động.';
      case 'NETWORK_ERROR':
      case 'REQUEST_TIMEOUT':
        return 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
      default:
        return FALLBACK_MESSAGE;
    }
  }

  if (
    error instanceof Error &&
    'code' in error &&
    error.code === 'MOBILE_CONFIGURATION_ERROR'
  ) {
    return error.message;
  }

  return FALLBACK_MESSAGE;
}

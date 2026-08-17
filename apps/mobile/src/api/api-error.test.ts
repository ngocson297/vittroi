import { ApiError, parseApiError, toUserMessage } from './api-error';

describe('API errors', () => {
  it('preserves stable backend fields', () => {
    const error = parseApiError(401, {
      statusCode: 401,
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Incorrect email or password.',
    });

    expect(error).toMatchObject({
      statusCode: 401,
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Incorrect email or password.',
    });
    expect(toUserMessage(error)).toBe('Email hoặc mật khẩu không đúng.');
  });

  it('uses a safe fallback for invalid or empty response bodies', () => {
    const error = parseApiError(500, '<html>unexpected</html>');
    expect(error.code).toBe('API_UNEXPECTED_ERROR');
    expect(toUserMessage(error)).toBe('Đã có lỗi xảy ra. Vui lòng thử lại.');
  });

  it('maps network failures without leaking technical details', () => {
    expect(toUserMessage(new ApiError(0, 'NETWORK_ERROR'))).toContain(
      'Không thể kết nối đến máy chủ',
    );
  });
});

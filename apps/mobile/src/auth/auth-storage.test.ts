import { parseStoredTokens } from './auth-storage';

describe('auth token storage parsing', () => {
  it('accepts a complete token pair', () => {
    expect(
      parseStoredTokens(
        JSON.stringify({
          accessToken: 'access',
          refreshToken: 'refresh',
          tokenType: 'Bearer',
        }),
      ),
    ).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
    });
  });

  it.each([
    null,
    '',
    'not-json',
    JSON.stringify({ accessToken: 'access' }),
    JSON.stringify({ refreshToken: 'refresh' }),
    JSON.stringify({ accessToken: '', refreshToken: 'refresh', tokenType: 'Bearer' }),
  ])('treats corrupt or partial state as unauthenticated', (value) => {
    expect(parseStoredTokens(value)).toBeNull();
  });
});

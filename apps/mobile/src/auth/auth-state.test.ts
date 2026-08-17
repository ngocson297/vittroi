import { authReducer, initialAuthState } from './auth-state';
import type { AuthUser } from './auth-types';

const user: AuthUser = {
  id: 'a219d75d-2978-4b4d-960d-4bc67b83c067',
  email: 'mobile.test@example.com',
  status: 'ACTIVE',
  createdAt: '2026-08-17T00:00:00.000Z',
  updatedAt: '2026-08-17T00:00:00.000Z',
};

describe('auth state reducer', () => {
  it('keeps loading distinct from unauthenticated', () => {
    expect(initialAuthState).toEqual({ status: 'loading', user: null });
    expect(authReducer(initialAuthState, { type: 'UNAUTHENTICATED' })).toEqual({
      status: 'unauthenticated',
      user: null,
    });
  });

  it('establishes and clears authenticated state', () => {
    const authenticated = authReducer(initialAuthState, {
      type: 'AUTHENTICATED',
      user,
    });
    expect(authenticated).toEqual({ status: 'authenticated', user });
    expect(authReducer(authenticated, { type: 'UNAUTHENTICATED' })).toEqual({
      status: 'unauthenticated',
      user: null,
    });
  });
});

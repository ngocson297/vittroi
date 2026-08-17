import type { AuthUser } from './auth-types';

export type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'unauthenticated'; user: null };

export type AuthAction =
  | { type: 'RESTORE_START' }
  | { type: 'AUTHENTICATED'; user: AuthUser }
  | { type: 'UNAUTHENTICATED' };

export const initialAuthState: AuthState = { status: 'loading', user: null };

export function authReducer(
  _state: AuthState,
  action: AuthAction,
): AuthState {
  switch (action.type) {
    case 'RESTORE_START':
      return initialAuthState;
    case 'AUTHENTICATED':
      return { status: 'authenticated', user: action.user };
    case 'UNAUTHENTICATED':
      return { status: 'unauthenticated', user: null };
  }
}

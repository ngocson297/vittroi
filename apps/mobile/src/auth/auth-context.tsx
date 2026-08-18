import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import { ApiClient } from '@/api/api-client';
import { AuthApi } from '@/api/auth-api';
import { getApiBaseUrl } from '@/config/environment';
import { authReducer, initialAuthState } from './auth-state';
import { authTokenStorage } from './auth-storage';
import type { AuthState } from './auth-state';

type AuthContextValue = AuthState & {
  register(email: string, password: string): Promise<void>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const ApiClientContext = createContext<ApiClient | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const [client] = useState(
    () =>
      new ApiClient({
        getBaseUrl: getApiBaseUrl,
        storage: authTokenStorage,
        onAuthInvalidated: () => dispatch({ type: 'UNAUTHENTICATED' }),
      }),
  );
  const authApi = useMemo(() => new AuthApi(client), [client]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      dispatch({ type: 'RESTORE_START' });
      try {
        const storedTokens = await client.readStoredTokens();
        if (!storedTokens) {
          if (active) dispatch({ type: 'UNAUTHENTICATED' });
          return;
        }

        const user = await authApi.getMe();
        if (active) dispatch({ type: 'AUTHENTICATED', user });
      } catch {
        try {
          await client.clearSession();
        } finally {
          if (active) dispatch({ type: 'UNAUTHENTICATED' });
        }
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, [authApi, client]);

  const register = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.register(email.trim(), password);
      dispatch({ type: 'AUTHENTICATED', user: response.user });
    },
    [authApi],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login(email.trim(), password);
      dispatch({ type: 'AUTHENTICATED', user: response.user });
    },
    [authApi],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Local logout must remain available when the API is offline or revoked.
    } finally {
      try {
        await client.clearSession();
      } finally {
        dispatch({ type: 'UNAUTHENTICATED' });
      }
    }
  }, [authApi, client]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, register, login, logout }),
    [state, register, login, logout],
  );

  return (
    <ApiClientContext.Provider value={client}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </ApiClientContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client) throw new Error('useApiClient must be used inside AuthProvider');
  return client;
}

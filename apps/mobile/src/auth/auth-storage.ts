import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthTokens } from './auth-types';
import { isAuthTokens } from './auth-types';

const AUTH_TOKENS_KEY = 'vit_troi.auth.tokens.v1';

export interface AuthTokenStorage {
  read(): Promise<AuthTokens | null>;
  save(tokens: AuthTokens): Promise<void>;
  clear(): Promise<void>;
}

export function parseStoredTokens(value: string | null): AuthTokens | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    return isAuthTokens(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

let webTokens: AuthTokens | null = null;

export const authTokenStorage: AuthTokenStorage = {
  async read() {
    if (Platform.OS === 'web') return webTokens;

    const storedValue = await SecureStore.getItemAsync(AUTH_TOKENS_KEY);
    const tokens = parseStoredTokens(storedValue);
    if (storedValue && !tokens) await SecureStore.deleteItemAsync(AUTH_TOKENS_KEY);
    return tokens;
  },

  async save(tokens) {
    if (Platform.OS === 'web') {
      webTokens = tokens;
      return;
    }

    await SecureStore.setItemAsync(AUTH_TOKENS_KEY, JSON.stringify(tokens));
  },

  async clear() {
    webTokens = null;
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(AUTH_TOKENS_KEY);
    }
  },
};

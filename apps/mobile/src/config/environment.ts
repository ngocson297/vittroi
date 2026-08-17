export class MobileConfigurationError extends Error {
  readonly code = 'MOBILE_CONFIGURATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'MobileConfigurationError';
  }
}

export function getApiBaseUrl(): string {
  const value = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (!value?.trim()) {
    throw new MobileConfigurationError(
      'EXPO_PUBLIC_API_BASE_URL is required. Copy .env.example to .env and configure the API address.',
    );
  }

  const normalized = value.trim().replace(/\/+$/, '');

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Unsupported protocol');
    }
  } catch {
    throw new MobileConfigurationError(
      'EXPO_PUBLIC_API_BASE_URL must be a valid http:// or https:// URL.',
    );
  }

  return normalized;
}

import type { ConfigContext, ExpoConfig } from 'expo/config';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const usesCleartextTraffic = apiBaseUrl.startsWith('http://');

export default ({ config }: ConfigContext): ExpoConfig => {
  if (!config.name || !config.slug) {
    throw new Error('Expo app name and slug are required');
  }

  return {
    ...config,
    name: config.name,
    slug: config.slug,
    plugins: [
      ...(config.plugins ?? []),
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic,
          },
        },
      ],
    ],
  };
};

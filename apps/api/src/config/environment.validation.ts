const POSTGRESQL_PROTOCOLS = new Set(['postgres:', 'postgresql:']);
const ACCESS_TOKEN_DURATION_PATTERN = /^(\d+)([smhd])$/;
const DURATION_MULTIPLIERS = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
} as const;

function parseAccessTokenDuration(value: unknown): number {
  const duration = value ?? '15m';

  if (typeof duration !== 'string') {
    throw new Error('JWT_ACCESS_EXPIRES_IN must be a duration such as 15m');
  }

  const match = ACCESS_TOKEN_DURATION_PATTERN.exec(duration.trim());

  if (!match) {
    throw new Error('JWT_ACCESS_EXPIRES_IN must be a duration such as 15m');
  }

  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof DURATION_MULTIPLIERS;
  const seconds = amount * DURATION_MULTIPLIERS[unit];

  if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > 86_400) {
    throw new Error('JWT_ACCESS_EXPIRES_IN must be between 1 second and 1 day');
  }

  return seconds;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const databaseUrl = config.DATABASE_URL;

  if (typeof databaseUrl !== 'string' || databaseUrl.trim() === '') {
    throw new Error('DATABASE_URL is required');
  }

  let parsedDatabaseUrl: URL;

  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }

  if (!POSTGRESQL_PROTOCOLS.has(parsedDatabaseUrl.protocol)) {
    throw new Error('DATABASE_URL must use the postgresql:// protocol');
  }

  const port = Number(config.PORT ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const jwtAccessSecret = config.JWT_ACCESS_SECRET;

  if (
    typeof jwtAccessSecret !== 'string' ||
    Buffer.byteLength(jwtAccessSecret, 'utf8') < 32
  ) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 bytes');
  }

  const refreshTokenTtlDays = Number(config.REFRESH_TOKEN_TTL_DAYS ?? 30);

  if (
    !Number.isSafeInteger(refreshTokenTtlDays) ||
    refreshTokenTtlDays < 1 ||
    refreshTokenTtlDays > 365
  ) {
    throw new Error('REFRESH_TOKEN_TTL_DAYS must be between 1 and 365');
  }

  return {
    ...config,
    DATABASE_URL: databaseUrl,
    PORT: port,
    JWT_ACCESS_SECRET: jwtAccessSecret,
    JWT_ACCESS_EXPIRES_IN: parseAccessTokenDuration(
      config.JWT_ACCESS_EXPIRES_IN,
    ),
    REFRESH_TOKEN_TTL_DAYS: refreshTokenTtlDays,
  };
}

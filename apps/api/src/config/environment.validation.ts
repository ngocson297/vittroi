const POSTGRESQL_PROTOCOLS = new Set(['postgres:', 'postgresql:']);

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

  return {
    ...config,
    DATABASE_URL: databaseUrl,
    PORT: port,
  };
}

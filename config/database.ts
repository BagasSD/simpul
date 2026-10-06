// Mendukung DATABASE_URL (Railway) atau variabel koneksi terpisah (development lokal).
export default ({ env }) => {
  const databaseUrl = env('DATABASE_URL');
  const ssl = env.bool('DATABASE_SSL', false)
    ? { rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true) }
    : false;

  return {
    connection: {
      client: 'postgres',
      connection: {
        ...(databaseUrl
          ? { connectionString: databaseUrl }
          : {
              host: env('DATABASE_HOST', '127.0.0.1'),
              port: env.int('DATABASE_PORT', 5432),
              database: env('DATABASE_NAME', 'simpul'),
              user: env('DATABASE_USERNAME', 'postgres'),
              password: env('DATABASE_PASSWORD', 'postgres'),
            }),
        schema: env('DATABASE_SCHEMA', 'public'),
        ssl,
      },
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};

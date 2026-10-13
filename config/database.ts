// Mendukung DATABASE_URL (Railway) atau variabel koneksi terpisah (development lokal).
export default ({ env }) => {
  const databaseUrl = env('DATABASE_URL');
  const host = env('DATABASE_HOST', env('PGHOST', '127.0.0.1'));
  const port = env.int('DATABASE_PORT', env.int('PGPORT', 5432));
  const database = env('DATABASE_NAME', env('PGDATABASE', 'simpul'));
  const user = env('DATABASE_USERNAME', env('PGUSER', 'postgres'));
  const password = env('DATABASE_PASSWORD', env('PGPASSWORD', 'postgres'));
  const isProduction = env('NODE_ENV') === 'production';

  if (
    isProduction &&
    !databaseUrl &&
    ['127.0.0.1', 'localhost', '::1'].includes(host)
  ) {
    throw new Error(
      'Production database is not configured. Set DATABASE_URL to the Railway PostgreSQL reference variable.',
    );
  }

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
              host,
              port,
              database,
              user,
              password,
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

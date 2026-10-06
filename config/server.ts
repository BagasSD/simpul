export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', ''),
  proxy: {
    koa: env.bool('PROXY_KOA', env('NODE_ENV') === 'production'),
    maxIpsCount: env.int('PROXY_MAX_IPS_COUNT', 1),
  },
  app: {
    keys: env.array('APP_KEYS'),
  },
});

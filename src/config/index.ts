import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;
export function validateEnv(): void {
  const productionEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM',
  ] as const;
  const allRequired =
    process.env.NODE_ENV === 'production'
      ? [...requiredEnvVars, ...productionEnvVars]
      : requiredEnvVars;
  const missing = allRequired.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (process.env.COOKIE_SAME_SITE && !['strict', 'none'].includes(process.env.COOKIE_SAME_SITE)) {
    throw new Error('COOKIE_SAME_SITE must be strict or none');
  }
  if (
    process.env.TRUST_PROXY_HOPS &&
    (!/^\d+$/.test(process.env.TRUST_PROXY_HOPS) || Number(process.env.TRUST_PROXY_HOPS) > 10)
  ) {
    throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 10');
  }
}

validateEnv();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  cookieSameSite: (process.env.COOKIE_SAME_SITE ||
    (process.env.NODE_ENV === 'production' ? 'none' : 'strict')) as 'strict' | 'none',
  runInProcessJobs: process.env.RUN_IN_PROCESS_JOBS !== 'false',
  trustProxyHops: Number(process.env.TRUST_PROXY_HOPS || '0'),

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(
      process.env.RATE_LIMIT_MAX || (process.env.NODE_ENV === 'development' ? '500' : '100'),
      10,
    ),
  },
} as const;

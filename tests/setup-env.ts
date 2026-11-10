import 'dotenv/config';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error('TEST_DATABASE_URL is required for database tests');
const parsed = new URL(testUrl);
if (
  !['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) ||
  !parsed.pathname.endsWith('_test')
) {
  throw new Error('TEST_DATABASE_URL must point to a local database ending in _test');
}
process.env.DATABASE_URL = testUrl;
process.env.JWT_ACCESS_SECRET ||= 'local-test-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'local-test-refresh-secret';

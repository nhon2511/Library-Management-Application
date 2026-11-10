import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});

import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_c7AIJwzevGB2@ep-sparkling-star-b59tmzrw-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
});

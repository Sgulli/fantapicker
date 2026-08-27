import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env'),
});

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    'Set DIRECT_URL for Neon migrations, or DATABASE_URL for local Docker.',
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
});

import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as z from "zod/mini";

config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env"),
});

function vercelHttpsOrigin(): string | undefined {
  const host = process.env.VERCEL_URL;
  if (!host) return undefined;
  return host.startsWith("https://") ? host : `https://${host}`;
}

const envSchema = z.object({
  DATABASE_URL: z.string().check(z.minLength(1)),
  PORT: z._default(z.coerce.number().check(z.int(), z.positive()), 3001),
  NODE_ENV: z._default(
    z.enum(["development", "test", "production"]),
    "development",
  ),
  BETTER_AUTH_SECRET: z.string().check(z.minLength(32)),
  BETTER_AUTH_URL: z.url(),
  WEB_ORIGIN: z.optional(z.url()),
});

const parsed = envSchema.parse({
  ...process.env,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? vercelHttpsOrigin(),
});

export const env = {
  ...parsed,
  WEB_ORIGIN: parsed.WEB_ORIGIN ?? parsed.BETTER_AUTH_URL,
};

export function publicOrigins(): string[] {
  return [
    ...new Set(
      [env.WEB_ORIGIN, env.BETTER_AUTH_URL, vercelHttpsOrigin()].filter(
        (origin): origin is string => Boolean(origin),
      ),
    ),
  ];
}

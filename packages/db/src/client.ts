import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

function isLoopbackHost(url: string): boolean {
  return /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
}

export function createDb(url: string, options?: { max?: number }) {
  const client = postgres(url, {
    max: options?.max ?? 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: isLoopbackHost(url) ? false : "require",
  });
  return drizzle({ client, schema });
}

export type Db = ReturnType<typeof createDb>;

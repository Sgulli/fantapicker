import { createDb } from "@fantapicker/db";
import { env } from "./env.ts";

export const db = createDb(env.DATABASE_URL, {
  max: process.env.VERCEL === "1" ? 1 : 10,
});

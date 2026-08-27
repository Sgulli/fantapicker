import * as z from "zod/mini";
import { auth } from "./plugins/auth.ts";

const seedEnv = z
  .object({
    ADMIN_EMAIL: z.email(),
    ADMIN_PASSWORD: z.string().check(z.minLength(8)),
  })
  .parse(process.env);

const ctx = await auth.$context;
const existing = await ctx.internalAdapter.findUserByEmail(seedEnv.ADMIN_EMAIL);
if (existing?.user) {
  console.log(`Admin già presente: ${seedEnv.ADMIN_EMAIL}`);
  process.exit(0);
}

const hash = await ctx.password.hash(seedEnv.ADMIN_PASSWORD);
const created = await ctx.internalAdapter.createUser(
  {
    email: seedEnv.ADMIN_EMAIL,
    name: "Admin",
    emailVerified: true,
  },
  { method: "email-password" },
);
await ctx.internalAdapter.linkAccount({
  userId: created.id,
  providerId: "credential",
  issuer: "local:credential",
  accountId: created.id,
  password: hash,
});

console.log(`Admin creato: ${seedEnv.ADMIN_EMAIL}`);
process.exit(0);

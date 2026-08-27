import { defineConfig } from "@neon/config/v1";

// App services: Lakebase Postgres only.
// Auth stays in-app (Better Auth + Drizzle), not Neon Auth.
// Region aws-eu-central-1: Object Storage / Functions / AI Gateway unavailable.
export default defineConfig({
  auth: false,
  branch: (branch) => {
    if (branch.isDefault) return {};
    if (!branch.exists) return { ttl: "7d" };
    return {};
  },
});

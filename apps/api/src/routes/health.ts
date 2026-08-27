import type { FastifyInstance } from "fastify";

export default async function healthRoutes(app: FastifyInstance) {
  const health = async () => ({ ok: true });
  app.get("/health", health);
  app.get("/api/health", health);
}

import Fastify, { type FastifyInstance } from "fastify";
import authPlugin from "./plugins/auth.ts";
import corsPlugin from "./plugins/cors.ts";
import errorHandlerPlugin from "./plugins/error-handler.ts";
import multipartPlugin from "./plugins/multipart.ts";
import apiRoutes from "./routes/api.ts";
import healthRoutes from "./routes/health.ts";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true, trustProxy: true });
  await app.register(corsPlugin);
  await app.register(multipartPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(authPlugin);
  await app.register(healthRoutes);
  await app.register(apiRoutes, { prefix: "/api" });
  return app;
}

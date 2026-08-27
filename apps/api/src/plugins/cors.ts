import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { publicOrigins } from "../env.ts";

async function corsPlugin(app: FastifyInstance) {
  await app.register(cors, {
    origin: publicOrigins(),
    credentials: true,
  });
}

export default fp(corsPlugin, { name: "cors", fastify: "5.x" });

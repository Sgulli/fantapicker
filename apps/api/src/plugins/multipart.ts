import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

async function multipartPlugin(app: FastifyInstance) {
  await app.register(multipart, {
    limits: { files: 1, fileSize: 10 * 1024 * 1024 },
    throwFileSizeLimit: true,
  });
}

export default fp(multipartPlugin, { name: "multipart", fastify: "5.x" });

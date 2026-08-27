import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

async function errorHandlerPlugin(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const status =
      typeof error === "object" && error && "statusCode" in error
        ? Number(error.statusCode)
        : 500;
    const safeStatus = status >= 400 ? status : 500;

    let message = "Errore interno";
    if (safeStatus === 413) message = "File troppo grande";
    else if (safeStatus < 500 && error instanceof Error)
      message = error.message;

    reply.code(safeStatus).send({ error: message });
  });
}

export default fp(errorHandlerPlugin, {
  name: "error-handler",
  fastify: "5.x",
});

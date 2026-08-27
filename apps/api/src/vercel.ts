import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "./app.ts";

const appPromise = buildApp();

export default async function handleVercelRequest(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const app = await appPromise;
  await app.ready();
  app.server.emit("request", req, res);
}

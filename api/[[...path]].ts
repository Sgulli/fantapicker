import type { IncomingMessage, ServerResponse } from "node:http";

type VercelHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => void | Promise<void>;

const handlerPromise: Promise<VercelHandler> = import("./.bundle/handler.mjs").then(
  (mod) => mod.default as VercelHandler,
);

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const handle = await handlerPromise;
  return handle(req, res);
}

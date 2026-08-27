import type { IncomingMessage, ServerResponse } from "node:http";

type NodeHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => void | Promise<void>;

// Dynamic import: Vercel compiles this entry as CJS; the esbuild bundle is ESM.
const ready = import("./.bundle/handler.mjs").then(
  (mod) => mod.default as NodeHandler,
);

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  return (await ready)(req, res);
}

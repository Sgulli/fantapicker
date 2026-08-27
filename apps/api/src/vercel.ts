import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "./app.ts";

const appPromise = buildApp();

function withRewrittenPath(req: IncomingMessage): void {
  const raw = req.url ?? "/";
  const url = new URL(raw, "http://vercel.local");
  const path = url.searchParams.get("__path");
  if (path == null) return;
  url.pathname = `/api/${path}`;
  url.searchParams.delete("__path");
  req.url = `${url.pathname}${url.search}`;
}

export default async function handleVercelRequest(
  req: IncomingMessage,
  res: ServerResponse,
) {
  withRewrittenPath(req);
  const app = await appPromise;
  await app.ready();
  app.server.emit("request", req, res);
}

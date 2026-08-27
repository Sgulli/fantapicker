import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { fromNodeHeaders } from "better-auth/node";
import { account, session, user, verification } from "@fantapicker/db";
import fp from "fastify-plugin";
import { db } from "../db.ts";
import { env, publicOrigins } from "../env.ts";

const HOP_BY_HOP = new Set([
  "connection",
  "content-length",
  "keep-alive",
  "transfer-encoding",
]);

const isProd = env.NODE_ENV === "production";
const cookieAttributes = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: isProd,
};

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: publicOrigins(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: false,
  },
  advanced: {
    useSecureCookies: isProd,
    defaultCookieAttributes: cookieAttributes,
  },
});

function nodeHeaders(request: FastifyRequest) {
  return fromNodeHeaders(request.headers);
}

function authUrl(request: FastifyRequest) {
  return new URL(request.raw.url ?? request.url, env.BETTER_AUTH_URL);
}

function canCarryBody(method: string, body: unknown) {
  return method !== "GET" && method !== "HEAD" && body != null;
}

function serializeBody(body: unknown) {
  return typeof body === "string" ? body : JSON.stringify(body);
}

function toAuthRequest(request: FastifyRequest): Request {
  const init: RequestInit = {
    method: request.method,
    headers: nodeHeaders(request),
  };
  if (canCarryBody(request.method, request.body)) {
    init.body = serializeBody(request.body);
  }
  return new Request(authUrl(request), init);
}

function shouldForwardHeader(name: string) {
  const lower = name.toLowerCase();
  return lower !== "set-cookie" && !HOP_BY_HOP.has(lower);
}

function copyResponseHeaders(reply: FastifyReply, response: Response) {
  response.headers.forEach((value, key) => {
    if (shouldForwardHeader(key)) reply.header(key, value);
  });
  for (const cookie of response.headers.getSetCookie()) {
    reply.header("set-cookie", cookie);
  }
}

async function readBody(response: Response) {
  const text = await response.text();
  return text.length > 0 ? text : null;
}

async function sendAuthResponse(reply: FastifyReply, response: Response) {
  reply.status(response.status);
  copyResponseHeaders(reply, response);
  reply.send(await readBody(response));
}

async function currentSession(request: FastifyRequest) {
  return auth.api.getSession({ headers: nodeHeaders(request) });
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (await currentSession(request)) return;
  return reply.code(401).send({ error: "Non autenticato" });
}

async function handleAuthRoute(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await sendAuthResponse(reply, await auth.handler(toAuthRequest(request)));
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: "Errore di autenticazione" });
  }
}

async function authPlugin(app: FastifyInstance) {
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    handler: handleAuthRoute,
  });
}

export default fp(authPlugin, { name: "auth", fastify: "5.x" });

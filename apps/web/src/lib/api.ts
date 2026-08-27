import * as z from "zod/mini";
import {
  importResponseSchema,
  pickResponseSchema,
  statsResponseSchema,
  type ImportResponse,
  type PickResponse,
  type StatsResponse,
} from "@fantapicker/shared";

const FETCH_TIMEOUT_MS = 15_000;
const apiErrorSchema = z.object({ error: z.optional(z.string()) });

type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false };

type SafeParseSchema<T> = {
  safeParse: (data: unknown) => SafeParseResult<T>;
};

async function readError(res: Response): Promise<string> {
  try {
    const parsed = apiErrorSchema.safeParse(await res.json());
    if (!parsed.success) return res.statusText;
    return parsed.data.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function request<T>(
  input: RequestInfo,
  schema: SafeParseSchema<T>,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, FETCH_TIMEOUT_MS);
  const incoming = init?.signal;
  const onAbort = () => controller.abort();
  if (incoming) {
    if (incoming.aborted) controller.abort();
    else incoming.addEventListener("abort", onAbort, { once: true });
  }
  try {
    const res = await fetch(input, {
      ...init,
      credentials: "include",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(await readError(res));
    const parsed = schema.safeParse(await res.json());
    if (!parsed.success) throw new Error("Risposta non valida");
    return parsed.data;
  } catch (error) {
    if (timedOut) throw new Error("Richiesta scaduta, riprova");
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
    incoming?.removeEventListener("abort", onAbort);
  }
}

export { isAbortError };

export function getStats(signal?: AbortSignal): Promise<StatsResponse> {
  return request("/api/stats", statsResponseSchema, { signal });
}

export function importXlsx(file: File): Promise<ImportResponse> {
  const body = new FormData();
  body.set("file", file);
  return request("/api/import", importResponseSchema, { method: "POST", body });
}

export function pickPlayer(
  role: string,
  excludeIds: number[],
  signal?: AbortSignal,
): Promise<PickResponse> {
  return request("/api/pick", pickResponseSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, excludeIds }),
    signal,
  });
}

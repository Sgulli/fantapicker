import {
  drawSessionSchema,
  type DrawSessionState,
} from "@fantapicker/shared";

export const DRAW_SESSION_KEY = "fantapicker.draw";
export type DrawSession = DrawSessionState;

export function parseDrawSession(raw: string): DrawSession | null {
  try {
    const parsed = drawSessionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function loadDrawSession(): DrawSession | null {
  try {
    const raw = sessionStorage.getItem(DRAW_SESSION_KEY);
    return raw ? parseDrawSession(raw) : null;
  } catch {
    return null;
  }
}

export function saveDrawSession(session: DrawSession): void {
  try {
    sessionStorage.setItem(DRAW_SESSION_KEY, JSON.stringify(session));
  } catch {
    return;
  }
}

export function clearDrawSession(): void {
  try {
    sessionStorage.removeItem(DRAW_SESSION_KEY);
  } catch {
    return;
  }
}

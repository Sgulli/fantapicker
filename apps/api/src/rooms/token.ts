import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "@fantapicker/shared";

export function generateRoomCode(): string {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => {
    const index = randomInt(ROOM_CODE_ALPHABET.length);
    return ROOM_CODE_ALPHABET[index] ?? "A";
  }).join("");
}

export function createHostToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashHostToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hostTokenMatches(token: string, hash: string): boolean {
  const actual = Buffer.from(hashHostToken(token), "hex");
  const expected = Buffer.from(hash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function bearerToken(header: string | string[] | undefined): string {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value?.startsWith("Bearer ")) return "";
  return value.slice("Bearer ".length);
}

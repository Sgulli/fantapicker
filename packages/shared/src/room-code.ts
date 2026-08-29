export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 5;

export function normalizeRoomCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isRoomCode(raw: string): boolean {
  const code = normalizeRoomCode(raw);
  return (
    code.length === ROOM_CODE_LENGTH &&
    [...code].every((char) => ROOM_CODE_ALPHABET.includes(char))
  );
}

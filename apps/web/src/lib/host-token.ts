const key = (code: string) => `fantapicker.host.${code}`;

export function saveHostToken(code: string, token: string): void {
  try {
    sessionStorage.setItem(key(code), token);
  } catch {
    return;
  }
}

export function loadHostToken(code: string): string {
  try {
    return sessionStorage.getItem(key(code)) ?? "";
  } catch {
    return "";
  }
}

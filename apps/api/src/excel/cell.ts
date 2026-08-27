export function cellScalar(value: unknown): string | number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") {
    const trimmed = value.replace(/\u00a0/g, " ").trim();
    return trimmed === "" ? null : trimmed;
  }
  if (typeof value !== "object") return String(value);
  if ("result" in value) return cellScalar(value.result);
  if ("text" in value) return cellScalar(value.text);
  if ("richText" in value && Array.isArray(value.richText)) {
    const text = value.richText
      .map((part) =>
        typeof part === "object" && part && "text" in part
          ? String(part.text)
          : "",
      )
      .join("");
    return cellScalar(text);
  }
  if (value instanceof Date) return value.toISOString();
  return null;
}

export function parseIntLoose(value: unknown): number | null {
  const scalar = cellScalar(value);
  if (scalar == null) return null;
  if (typeof scalar === "number") {
    return Number.isFinite(scalar) ? Math.round(scalar) : null;
  }
  const normalized = scalar.replace(/\s/g, "").replace(",", ".");
  if (normalized === "-" || normalized === "") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

export function parseMantraRoles(raw: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const roles: string[] = [];
  for (const part of raw.split(/[;|,/]+|\s{2,}/)) {
    const role = part.trim();
    if (!role || seen.has(role)) continue;
    seen.add(role);
    roles.push(role);
  }
  return roles;
}

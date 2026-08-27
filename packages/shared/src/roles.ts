export const MANTRA_ROLES = [
  "Por",
  "Dd",
  "Ds",
  "Dc",
  "B",
  "E",
  "M",
  "C",
  "W",
  "T",
  "A",
  "Pc",
] as const;

export type KnownMantraRole = (typeof MANTRA_ROLES)[number];

export const MANTRA_ROLE_LABELS: Record<KnownMantraRole, string> = {
  Por: "Portiere",
  Dd: "Dif. destro",
  Ds: "Dif. sinistro",
  Dc: "Dif. centrale",
  B: "Braccetto",
  E: "Esterno",
  M: "Mediano",
  C: "Cen. centrale",
  W: "Ala",
  T: "Trequartista",
  A: "Attaccante",
  Pc: "Punta centrale",
};

export function mantraRoleLabel(role: string): string {
  return role in MANTRA_ROLE_LABELS
    ? MANTRA_ROLE_LABELS[role as KnownMantraRole]
    : role;
}

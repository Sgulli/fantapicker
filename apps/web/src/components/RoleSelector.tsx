import { MANTRA_ROLES, mantraRoleLabel } from "@fantapicker/shared";
import { ToggleGroup, ToggleGroupItem } from "@fantapicker/ui/components/toggle-group";

const KNOWN_ROLES = new Set<string>(MANTRA_ROLES);

type RoleCount = { role: string; count: number };

type RoleSelectorProps = {
  roles: RoleCount[];
  value: string;
  onChange: (role: string) => void;
  locked?: boolean;
};

export function RoleSelector({
  roles,
  value,
  onChange,
  locked = false,
}: RoleSelectorProps) {
  const counts = new Map(roles.map((item) => [item.role, item.count]));
  const extras = roles
    .map((item) => item.role)
    .filter((role) => !KNOWN_ROLES.has(role));
  const ordered = [...MANTRA_ROLES, ...extras];

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      disabled={locked}
      onValueChange={(next) => {
        if (locked || !next) return;
        onChange(next);
      }}
      className="flex w-full max-w-3xl flex-wrap justify-center gap-2"
      aria-label="Ruolo mantra"
      aria-disabled={locked}
    >
      {ordered.map((role) => {
        const count = counts.get(role) ?? 0;
        return (
          <ToggleGroupItem
            key={role}
            value={role}
            disabled={locked || count === 0}
            aria-label={`${mantraRoleLabel(role)}, ${count} giocatori`}
            className="min-h-11 min-w-11 shrink-0 gap-1.5 border-white/20 bg-transparent px-3 font-normal text-foreground/80 hover:bg-white/5 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:font-semibold data-[state=on]:text-primary-foreground data-[state=on]:shadow-[0_0_16px_rgb(249_115_22/0.45)] data-[state=on]:ring-2 data-[state=on]:ring-white/50 data-[state=on]:hover:bg-primary/90 disabled:border-white/10 disabled:text-muted-foreground/50 disabled:opacity-40 disabled:grayscale"
          >
            <span>{role}</span>
            <span
              className={
                role === value
                  ? "text-primary-foreground/85 text-xs tabular-nums"
                  : "text-muted-foreground text-xs tabular-nums"
              }
            >
              {count}
            </span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

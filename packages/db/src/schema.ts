import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const players = pgTable(
  "players",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id").notNull(),
    name: text("name").notNull(),
    team: text("team"),
    classicRole: text("classic_role"),
    mantraRolesRaw: text("mantra_roles_raw"),
    mantraRoles: text("mantra_roles").array().notNull().default([]),
    quotationCurrent: integer("quotation_current"),
    quotationInitial: integer("quotation_initial"),
    quotationDiff: integer("quotation_diff"),
    fvm: integer("fvm"),
    extras: jsonb("extras")
      .$type<Record<string, string | number | null>>()
      .notNull()
      .default({}),
  },
  (t) => [
    uniqueIndex("players_player_id_uidx").on(t.playerId),
    index("players_mantra_roles_gin").using("gin", t.mantraRoles),
  ],
);

export type PlayerRow = typeof players.$inferSelect;
export type NewPlayerRow = typeof players.$inferInsert;

export {
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
} from "./auth-schema.ts";

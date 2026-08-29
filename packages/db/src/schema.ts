import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
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

export type RoomStateRow = {
  role: string;
  drawn: unknown[];
  exhaustedRoles: string[];
  paused: boolean;
  cooldownEndsAt: number | null;
  pausedMs: number | null;
};

export const rooms = pgTable(
  "rooms",
  {
    code: text("code").primaryKey(),
    hostTokenHash: text("host_token_hash").notNull(),
    state: jsonb("state").$type<RoomStateRow>().notNull(),
    version: integer("version").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (t) => [index("rooms_expires_at_idx").on(t.expiresAt)],
);

export type RoomRow = typeof rooms.$inferSelect;
export type NewRoomRow = typeof rooms.$inferInsert;

export {
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
} from "./auth-schema.ts";

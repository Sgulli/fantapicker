CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"name" text NOT NULL,
	"team" text,
	"classic_role" text,
	"mantra_roles_raw" text,
	"mantra_roles" text[] DEFAULT '{}' NOT NULL,
	"quotation_current" integer,
	"quotation_initial" integer,
	"quotation_diff" integer,
	"fvm" integer,
	"extras" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "players_player_id_uidx" ON "players" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "players_mantra_roles_gin" ON "players" USING gin ("mantra_roles");
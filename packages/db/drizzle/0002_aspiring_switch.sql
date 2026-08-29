CREATE TABLE "rooms" (
	"code" text PRIMARY KEY NOT NULL,
	"host_token_hash" text NOT NULL,
	"state" jsonb NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rooms_expires_at_idx" ON "rooms" USING btree ("expires_at");
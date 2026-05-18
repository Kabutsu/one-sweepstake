CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tla" text,
	"crest" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams_tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" text NOT NULL,
	"tournament_id" uuid NOT NULL,
	"ranking" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_team_tournament" UNIQUE("team_id","tournament_id")
);
--> statement-breakpoint
ALTER TABLE "teams_tournaments" ADD CONSTRAINT "teams_tournaments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams_tournaments" ADD CONSTRAINT "teams_tournaments_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "teams_tournaments_team_idx" ON "teams_tournaments" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "teams_tournaments_tournament_idx" ON "teams_tournaments" USING btree ("tournament_id");--> statement-breakpoint
ALTER TABLE "match_cache" ADD CONSTRAINT "match_cache_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_cache" ADD CONSTRAINT "match_cache_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_assignments" ADD CONSTRAINT "team_assignments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_cache_home_team_idx" ON "match_cache" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "match_cache_away_team_idx" ON "match_cache" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "team_assignments_team_idx" ON "team_assignments" USING btree ("team_id");--> statement-breakpoint
ALTER TABLE "match_cache" DROP COLUMN "home_team_name";--> statement-breakpoint
ALTER TABLE "match_cache" DROP COLUMN "home_team_crest";--> statement-breakpoint
ALTER TABLE "match_cache" DROP COLUMN "away_team_name";--> statement-breakpoint
ALTER TABLE "match_cache" DROP COLUMN "away_team_crest";--> statement-breakpoint
ALTER TABLE "sweepstakes" DROP COLUMN "current_participants";--> statement-breakpoint
ALTER TABLE "team_assignments" DROP COLUMN "team_name";--> statement-breakpoint
ALTER TABLE "team_assignments" DROP COLUMN "team_logo";--> statement-breakpoint
ALTER TABLE "tournaments" DROP COLUMN "seeding_config";
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sweepstake_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"api_match_id" text NOT NULL,
	"home_team_id" text NOT NULL,
	"home_team_name" text NOT NULL,
	"home_team_crest" text,
	"away_team_id" text NOT NULL,
	"away_team_name" text NOT NULL,
	"away_team_crest" text,
	"home_score" integer,
	"away_score" integer,
	"status" text NOT NULL,
	"stage" text,
	"scheduled_at" timestamp NOT NULL,
	"raw_data" jsonb,
	"last_fetched_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "match_cache_api_match_id_unique" UNIQUE("api_match_id")
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sweepstake_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_sweepstake_user" UNIQUE("sweepstake_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "sweepstakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"name" text NOT NULL,
	"creator_id" uuid NOT NULL,
	"join_code" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"max_participants" integer NOT NULL,
	"current_participants" integer DEFAULT 0 NOT NULL,
	"draw_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sweepstakes_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "team_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"team_id" text NOT NULL,
	"team_name" text NOT NULL,
	"team_logo" text,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_participant_team" UNIQUE("participant_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"api_id" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"team_count" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"logo" text,
	"seeding_config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tournaments_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tournaments_api_id_unique" UNIQUE("api_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_display_name_unique" UNIQUE("display_name")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sweepstake_id_sweepstakes_id_fk" FOREIGN KEY ("sweepstake_id") REFERENCES "public"."sweepstakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_cache" ADD CONSTRAINT "match_cache_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_sweepstake_id_sweepstakes_id_fk" FOREIGN KEY ("sweepstake_id") REFERENCES "public"."sweepstakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sweepstakes" ADD CONSTRAINT "sweepstakes_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sweepstakes" ADD CONSTRAINT "sweepstakes_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_assignments" ADD CONSTRAINT "team_assignments_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_sweepstake_idx" ON "chat_messages" USING btree ("sweepstake_id");--> statement-breakpoint
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "match_cache_tournament_idx" ON "match_cache" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "match_cache_status_idx" ON "match_cache" USING btree ("status");--> statement-breakpoint
CREATE INDEX "participants_sweepstake_idx" ON "participants" USING btree ("sweepstake_id");--> statement-breakpoint
CREATE INDEX "participants_user_idx" ON "participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sweepstakes_tournament_idx" ON "sweepstakes" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "sweepstakes_creator_idx" ON "sweepstakes" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "team_assignments_participant_idx" ON "team_assignments" USING btree ("participant_id");
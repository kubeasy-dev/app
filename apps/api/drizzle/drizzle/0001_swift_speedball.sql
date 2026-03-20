CREATE TYPE "public"."xp_action" AS ENUM('challenge_completed', 'daily_streak', 'first_challenge', 'milestone_reached', 'bonus');--> statement-breakpoint
CREATE TABLE "user_xp" (
	"user_id" text PRIMARY KEY NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_xp_transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" "xp_action" NOT NULL,
	"xp_amount" integer NOT NULL,
	"challenge_id" integer,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_category" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "email_category_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text NOT NULL,
	"audience_id" uuid,
	"force_subscription" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_category_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_email_preference" (
	"user_id" text NOT NULL,
	"category_id" integer NOT NULL,
	"subscribed" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"contact_id" uuid,
	CONSTRAINT "user_email_preference_user_id_category_id_pk" PRIMARY KEY("user_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "challenge_theme" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "rate_limit_time_window" SET DEFAULT 86400000;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "challenge_theme" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "user_xp" ADD CONSTRAINT "user_xp_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_xp_transaction" ADD CONSTRAINT "user_xp_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_xp_transaction" ADD CONSTRAINT "user_xp_transaction_challenge_id_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenge"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_email_preference" ADD CONSTRAINT "user_email_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_email_preference" ADD CONSTRAINT "user_email_preference_category_id_email_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."email_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_xp_total_xp_idx" ON "user_xp" USING btree ("total_xp");--> statement-breakpoint
CREATE INDEX "user_xp_transaction_user_id_idx" ON "user_xp_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_xp_transaction_user_action_idx" ON "user_xp_transaction" USING btree ("user_id","action");--> statement-breakpoint
CREATE INDEX "challenge_difficulty_idx" ON "challenge" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "challenge_theme_idx" ON "challenge" USING btree ("theme");--> statement-breakpoint
CREATE INDEX "challenge_theme_difficulty_idx" ON "challenge" USING btree ("theme","difficulty");--> statement-breakpoint
CREATE INDEX "challenge_title_idx" ON "challenge" USING btree ("title");--> statement-breakpoint
CREATE INDEX "challenge_created_at_idx" ON "challenge" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_progress_user_status_challenge_idx" ON "user_progress" USING btree ("user_id","status","challenge_id");--> statement-breakpoint
CREATE INDEX "user_progress_challenge_status_idx" ON "user_progress" USING btree ("challenge_id","status");--> statement-breakpoint
INSERT INTO "email_category" ("name", "description", "force_subscription", "audience_id") VALUES
  ('Transactional Emails', 'Essential account-related emails such as confirmations, notifications, and security alerts.', true, NULL),
  ('Marketing Emails', 'General audience for all marketing emails, including newsletters, product updates, announcements, and more.', false, NULL);
CREATE TABLE "user_onboarding" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"completed_at" timestamp,
	"skipped_at" timestamp,
	"cli_authenticated" boolean DEFAULT false NOT NULL,
	"cluster_initialized" boolean DEFAULT false NOT NULL,
	"workflow_run_id" text,
	"token_webhook_url" text,
	"login_webhook_url" text,
	"setup_webhook_url" text,
	"start_webhook_url" text,
	"complete_webhook_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_onboarding_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_onboarding" ADD CONSTRAINT "user_onboarding_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_onboarding_user_id_idx" ON "user_onboarding" USING btree ("user_id");
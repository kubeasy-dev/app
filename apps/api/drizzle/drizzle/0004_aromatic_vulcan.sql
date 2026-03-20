CREATE TYPE "public"."objective_category" AS ENUM('status', 'log', 'event', 'metrics', 'rbac', 'connectivity');--> statement-breakpoint
CREATE TABLE "challenge_objective" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"objective_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" "objective_category" NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenge_objective" ADD CONSTRAINT "challenge_objective_challenge_id_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenge"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "challenge_objective_challenge_key_idx" ON "challenge_objective" USING btree ("challenge_id","objective_key");--> statement-breakpoint
CREATE INDEX "challenge_objective_challenge_id_idx" ON "challenge_objective" USING btree ("challenge_id");
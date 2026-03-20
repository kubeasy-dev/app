DROP INDEX "challenge_objective_challenge_key_idx";--> statement-breakpoint
ALTER TABLE "challenge" ADD COLUMN "starter_friendly" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "apikey_key_idx" ON "apikey" USING btree ("key");--> statement-breakpoint
CREATE INDEX "apikey_userId_idx" ON "apikey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "challenge_starter_friendly_idx" ON "challenge" USING btree ("starter_friendly");--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_objective_challenge_key_idx" ON "challenge_objective" USING btree ("challenge_id","objective_key");
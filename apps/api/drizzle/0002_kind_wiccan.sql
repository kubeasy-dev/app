ALTER TABLE "user_submission" ADD COLUMN "attempt_number" integer;--> statement-breakpoint
ALTER TABLE "user_submission" ADD COLUMN "audit_events" jsonb;
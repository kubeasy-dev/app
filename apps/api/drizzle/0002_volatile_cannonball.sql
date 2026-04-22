ALTER TABLE "user_submission" ADD COLUMN "attempt_number" integer;--> statement-breakpoint
ALTER TABLE "user_submission" ADD COLUMN "audit_events" jsonb;--> statement-breakpoint
UPDATE "user_submission"
SET "attempt_number" = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, challenge_id ORDER BY "timestamp") AS rn
  FROM "user_submission"
) sub
WHERE "user_submission".id = sub.id;
ALTER TABLE "user_submission" ALTER COLUMN "static_validation" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_submission" ALTER COLUMN "static_validation" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_submission" ALTER COLUMN "dynamic_validation" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_submission" ALTER COLUMN "dynamic_validation" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_submission" ALTER COLUMN "payload" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_submission" ADD COLUMN "validated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_submission" ADD COLUMN "validations" json;
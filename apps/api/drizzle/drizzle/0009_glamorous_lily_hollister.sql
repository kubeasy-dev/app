ALTER TABLE "challenge_objective" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DELETE FROM "challenge_objective" WHERE "category" NOT IN ('status', 'condition', 'log', 'event', 'connectivity');--> statement-breakpoint
DROP TYPE "public"."objective_category";--> statement-breakpoint
CREATE TYPE "public"."objective_category" AS ENUM('status', 'condition', 'log', 'event', 'connectivity');--> statement-breakpoint
ALTER TABLE "challenge_objective" ALTER COLUMN "category" SET DATA TYPE "public"."objective_category" USING "category"::"public"."objective_category";
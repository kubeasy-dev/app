CREATE TABLE "email_topic" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "email_topic_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"resend_topic_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_opt_in" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_topic_resend_topic_id_unique" UNIQUE("resend_topic_id")
);
--> statement-breakpoint
DROP TABLE "session" CASCADE;--> statement-breakpoint
DROP TABLE "email_category" CASCADE;--> statement-breakpoint
DROP TABLE "user_email_preference" CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "resend_contact_id" text;
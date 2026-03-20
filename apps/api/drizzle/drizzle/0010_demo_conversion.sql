CREATE TABLE IF NOT EXISTS "demo_conversion" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"converted_at" timestamp,
	"converted_user_id" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text
);
--> statement-breakpoint
ALTER TABLE "demo_conversion" ADD CONSTRAINT "demo_conversion_converted_user_id_user_id_fk" FOREIGN KEY ("converted_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "demo_conversion_user_id_idx" ON "demo_conversion" USING btree ("converted_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "demo_conversion_created_at_idx" ON "demo_conversion" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "demo_conversion_utm_source_idx" ON "demo_conversion" USING btree ("utm_source");

CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"idempotency_key" text NOT NULL,
	"template" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"status" text NOT NULL,
	"provider_message_id" text,
	"error" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid
);
--> statement-breakpoint
CREATE UNIQUE INDEX "email_logs_idempotency_key_idx" ON "email_logs" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "email_logs_user_id_idx" ON "email_logs" ("user_id");--> statement-breakpoint
CREATE INDEX "email_logs_email_idx" ON "email_logs" ("email");--> statement-breakpoint
CREATE INDEX "email_logs_created_at_idx" ON "email_logs" ("created_at");--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");
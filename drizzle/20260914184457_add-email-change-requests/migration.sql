CREATE TABLE "email_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"canonical_email" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 minutes') NOT NULL,
	"used_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "email_change_requests_user_id_idx" ON "email_change_requests" ("user_id");--> statement-breakpoint
CREATE INDEX "email_change_requests_canonical_email_idx" ON "email_change_requests" ("canonical_email");--> statement-breakpoint
CREATE INDEX "email_change_requests_expires_at_idx" ON "email_change_requests" ("expires_at");--> statement-breakpoint
ALTER TABLE "email_change_requests" ADD CONSTRAINT "email_change_requests_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER INDEX "user_id_idx" RENAME TO "documents_user_id_idx";--> statement-breakpoint
ALTER INDEX "email_idx" RENAME TO "users_email_idx";--> statement-breakpoint
ALTER TABLE "otps" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "otps" ADD COLUMN "used_at" timestamp;--> statement-breakpoint
CREATE INDEX "otps_user_id_idx" ON "otps" ("user_id");--> statement-breakpoint
CREATE INDEX "otps_email_idx" ON "otps" ("email");
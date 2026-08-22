DROP INDEX "otps_email_idx";--> statement-breakpoint
ALTER TABLE "otps" ADD COLUMN "canonical_email" text;--> statement-breakpoint
UPDATE "otps" SET "canonical_email" = lower("email");--> statement-breakpoint
ALTER TABLE "otps" ALTER COLUMN "canonical_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "otps" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "otps_canonical_email_idx" ON "otps" ("canonical_email");--> statement-breakpoint
UPDATE "users" SET "email" = lower("email")
WHERE "email" <> lower("email")
AND NOT EXISTS (
  SELECT 1 FROM "users" "existing"
  WHERE "existing"."email" = lower("users"."email")
);

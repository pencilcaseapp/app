ALTER TABLE "documents" RENAME COLUMN "shared" TO "link_shared";--> statement-breakpoint
ALTER TABLE "document_collaborators" DROP CONSTRAINT "document_collaborators_user_or_email_check";--> statement-breakpoint
ALTER TABLE "document_collaborators" DROP CONSTRAINT "document_collaborators_invite_access_check";--> statement-breakpoint
ALTER TABLE "document_collaborators" ADD COLUMN "source" text;--> statement-breakpoint
UPDATE "document_collaborators" SET "source" = CASE WHEN "email" IS NOT NULL THEN 'invite' ELSE 'link' END WHERE "source" IS NULL;--> statement-breakpoint
ALTER TABLE "document_collaborators" ALTER COLUMN "source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "document_collaborators" ADD CONSTRAINT "document_collaborators_source_check" CHECK ("source" IN ('link', 'invite'));--> statement-breakpoint
ALTER TABLE "document_collaborators" ADD CONSTRAINT "document_collaborators_link_shape_check" CHECK ("source" <> 'link' OR ("user_id" IS NOT NULL AND "email" IS NULL AND "access" IS NULL));--> statement-breakpoint
ALTER TABLE "document_collaborators" ADD CONSTRAINT "document_collaborators_invite_shape_check" CHECK ("source" <> 'invite' OR ("email" IS NOT NULL AND "access" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "document_collaborators" DROP CONSTRAINT "document_collaborators_accepted_invite_check", ADD CONSTRAINT "document_collaborators_accepted_invite_check" CHECK ("accepted_at" IS NULL OR ("source" = 'invite' AND "user_id" IS NOT NULL));

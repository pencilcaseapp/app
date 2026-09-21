ALTER TABLE "document_collaborators" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "document_collaborators" ADD COLUMN "access" text;--> statement-breakpoint
ALTER TABLE "document_collaborators" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "document_collaborators_document_id_email_idx" ON "document_collaborators" ("document_id","email");--> statement-breakpoint
ALTER TABLE "document_collaborators" ADD CONSTRAINT "document_collaborators_user_or_email_check" CHECK ("user_id" IS NOT NULL OR "email" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "document_collaborators" ADD CONSTRAINT "document_collaborators_invite_access_check" CHECK (("email" IS NULL) = ("access" IS NULL));
CREATE TABLE "document_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"document_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "shared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "document_collaborators_document_id_user_id_idx" ON "document_collaborators" ("document_id","user_id");--> statement-breakpoint
CREATE INDEX "document_collaborators_user_id_idx" ON "document_collaborators" ("user_id");--> statement-breakpoint
CREATE INDEX "document_collaborators_document_id_idx" ON "document_collaborators" ("document_id");--> statement-breakpoint
ALTER TABLE "document_collaborators" ADD CONSTRAINT "document_collaborators_document_id_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id");--> statement-breakpoint
ALTER TABLE "document_collaborators" ADD CONSTRAINT "document_collaborators_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");
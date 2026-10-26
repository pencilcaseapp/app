CREATE TABLE "document_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"document_id" uuid,
	"user_id" uuid,
	"reason" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "document_reports_document_id_idx" ON "document_reports" ("document_id");--> statement-breakpoint
CREATE INDEX "document_reports_user_id_idx" ON "document_reports" ("user_id");--> statement-breakpoint
CREATE INDEX "document_reports_created_at_idx" ON "document_reports" ("created_at");--> statement-breakpoint
ALTER TABLE "document_reports" ADD CONSTRAINT "document_reports_document_id_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "document_reports" ADD CONSTRAINT "document_reports_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
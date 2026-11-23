CREATE TABLE "document_pins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"document_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"pinned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "document_pins_user_id_document_id_idx" ON "document_pins" ("user_id","document_id");--> statement-breakpoint
CREATE INDEX "document_pins_document_id_idx" ON "document_pins" ("document_id");--> statement-breakpoint
ALTER TABLE "document_pins" ADD CONSTRAINT "document_pins_document_id_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id");--> statement-breakpoint
ALTER TABLE "document_pins" ADD CONSTRAINT "document_pins_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");
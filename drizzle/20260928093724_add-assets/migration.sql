CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"document_id" uuid NOT NULL,
	"user_id" uuid,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "assets_storage_key_idx" ON "assets" ("storage_key");--> statement-breakpoint
CREATE INDEX "assets_document_id_idx" ON "assets" ("document_id");--> statement-breakpoint
CREATE INDEX "assets_user_id_idx" ON "assets" ("user_id");--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_document_id_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id");--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");
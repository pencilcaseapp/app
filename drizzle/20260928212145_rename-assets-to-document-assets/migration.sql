ALTER TABLE "assets" RENAME TO "document_assets";--> statement-breakpoint
ALTER INDEX "assets_storage_key_idx" RENAME TO "document_assets_storage_key_idx";--> statement-breakpoint
ALTER INDEX "assets_document_id_idx" RENAME TO "document_assets_document_id_idx";--> statement-breakpoint
ALTER INDEX "assets_user_id_idx" RENAME TO "document_assets_user_id_idx";
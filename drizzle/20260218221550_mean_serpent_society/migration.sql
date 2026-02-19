CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text,
	"content" bytea,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

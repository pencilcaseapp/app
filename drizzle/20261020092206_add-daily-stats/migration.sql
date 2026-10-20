CREATE TABLE "daily_stats" (
	"date" date PRIMARY KEY,
	"accounts_created" integer DEFAULT 0 NOT NULL,
	"accounts_deleted" integer DEFAULT 0 NOT NULL,
	"documents_created" integer DEFAULT 0 NOT NULL,
	"documents_deleted" integer DEFAULT 0 NOT NULL
);

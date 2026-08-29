CREATE TABLE "creem_webhook_events" (
	"id" text PRIMARY KEY,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"creem_subscription_id" text NOT NULL,
	"creem_customer_id" text NOT NULL,
	"creem_product_id" text NOT NULL,
	"status" text NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"canceled_at" timestamp,
	"price_amount" integer,
	"price_currency" text,
	"billing_period" text,
	"creem_updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "creem_customer_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_creem_subscription_id_idx" ON "subscriptions" ("creem_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_creem_customer_id_idx" ON "users" ("creem_customer_id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");
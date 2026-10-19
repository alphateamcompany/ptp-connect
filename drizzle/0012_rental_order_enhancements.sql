ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "billing_company" varchar(255);
--> statement-breakpoint
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "site_location" varchar(255);
--> statement-breakpoint
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "generator_kva" varchar(50);
--> statement-breakpoint
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "gst_rate" numeric(5, 2) DEFAULT '18';

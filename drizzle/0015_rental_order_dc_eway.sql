ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "dc_number" varchar(100);
--> statement-breakpoint
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "eway_bill" varchar(100);

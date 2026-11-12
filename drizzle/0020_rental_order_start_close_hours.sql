ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "start_hours" numeric(10, 2);
--> statement-breakpoint
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "close_hours" numeric(10, 2);

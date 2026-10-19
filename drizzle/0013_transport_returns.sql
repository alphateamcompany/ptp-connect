ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "start_date" varchar(50);
--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "starting_hours" integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "driver_name" varchar(255);
--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "vehicle_number" varchar(100);
--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "closing_date" varchar(50);
--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "return_driver_name" varchar(255);
--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "return_vehicle_number" varchar(100);
--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'Completed';

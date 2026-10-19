ALTER TABLE "generators" ADD COLUMN IF NOT EXISTS "manufacturing_year" varchar(50);
--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN IF NOT EXISTS "engine_make" varchar(255);
--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN IF NOT EXISTS "alternator_make" varchar(255);
--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN IF NOT EXISTS "asset_id" varchar(100);
--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN IF NOT EXISTS "drive_link" text;

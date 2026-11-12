ALTER TABLE "generators" ADD COLUMN IF NOT EXISTS "buying_person_name" varchar(255);
--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN IF NOT EXISTS "buying_person_phone" varchar(50);
--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN IF NOT EXISTS "selling_person_name" varchar(255);
--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN IF NOT EXISTS "selling_person_phone" varchar(50);

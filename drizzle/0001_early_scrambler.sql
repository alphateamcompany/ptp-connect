ALTER TABLE "generators" DROP CONSTRAINT "generators_serial_number_unique";--> statement-breakpoint
ALTER TABLE "generators" ALTER COLUMN "status" SET DEFAULT 'Available';--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN "generator_id" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN "brand" varchar(255);--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN "engine_number" varchar(100);--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN "alternator_number" varchar(100);--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN "controller_type" varchar(100);--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN "fuel_tank_liters" integer;--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN "purchase_date" varchar(50);--> statement-breakpoint
ALTER TABLE "generators" ADD COLUMN "purchase_cost" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "generators" ADD CONSTRAINT "generators_generator_id_unique" UNIQUE("generator_id");
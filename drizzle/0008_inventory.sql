CREATE TABLE IF NOT EXISTS "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"part_number" varchar(100) NOT NULL,
	"part_name" varchar(255) NOT NULL,
	"category" varchar(100) DEFAULT 'General' NOT NULL,
	"compatible_generator" varchar(255) NOT NULL,
	"qty_available" integer DEFAULT 0 NOT NULL,
	"reorder_level" integer DEFAULT 10 NOT NULL,
	"unit_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"location" varchar(255) DEFAULT 'Chennai Main Warehouse' NOT NULL,
	"status" varchar(50) DEFAULT 'In Stock' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_part_number_unique" UNIQUE("part_number")
);

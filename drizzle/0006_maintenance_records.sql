CREATE TABLE "maintenance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"generator_id" integer,
	"generator_name" varchar(255) NOT NULL,
	"service_type" varchar(100) NOT NULL,
	"service_date" varchar(50) NOT NULL,
	"technician" varchar(255),
	"cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"hours_at_service" integer DEFAULT 0 NOT NULL,
	"next_service_hours" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"mark_available" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_generator_id_generators_id_fk" FOREIGN KEY ("generator_id") REFERENCES "public"."generators"("id") ON DELETE set null ON UPDATE no action;

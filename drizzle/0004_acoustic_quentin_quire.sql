CREATE TABLE "dispatches" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"order_number" varchar(50) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"generator_name" varchar(255) NOT NULL,
	"dispatch_date" varchar(50) NOT NULL,
	"dispatch_time" varchar(50),
	"driver_name" varchar(255) NOT NULL,
	"vehicle_number" varchar(100) NOT NULL,
	"hours_before_dispatch" integer DEFAULT 0,
	"fuel_filled" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "payment_terms" SET DEFAULT 'Cash';--> statement-breakpoint
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_order_id_rental_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."rental_orders"("id") ON DELETE set null ON UPDATE no action;
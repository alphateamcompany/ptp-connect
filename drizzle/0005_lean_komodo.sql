CREATE TABLE "site_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"order_number" varchar(50) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"generator_name" varchar(255) NOT NULL,
	"log_date" varchar(50) NOT NULL,
	"location" varchar(255),
	"running_hours" integer DEFAULT 0 NOT NULL,
	"diesel_filled" integer DEFAULT 0 NOT NULL,
	"diesel_balance" integer DEFAULT 0 NOT NULL,
	"operator_remarks" text,
	"breakdown_report" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_logs" ADD CONSTRAINT "site_logs_order_id_rental_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."rental_orders"("id") ON DELETE set null ON UPDATE no action;
CREATE TABLE "rental_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"customer_id" integer,
	"customer_name" varchar(255) NOT NULL,
	"generator_id" integer,
	"generator_name" varchar(255) NOT NULL,
	"start_date" varchar(50) NOT NULL,
	"end_date" varchar(50) NOT NULL,
	"rental_type" varchar(50) DEFAULT 'Daily' NOT NULL,
	"daily_rate" numeric(10, 2) NOT NULL,
	"transport_charges" numeric(10, 2) DEFAULT '0',
	"security_deposit" numeric(10, 2) DEFAULT '0',
	"diesel_included" boolean DEFAULT false NOT NULL,
	"operator_included" boolean DEFAULT false NOT NULL,
	"rental_charge" numeric(12, 2) NOT NULL,
	"gst_amount" numeric(12, 2) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'Active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rental_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
ALTER TABLE "rental_orders" ADD CONSTRAINT "rental_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_orders" ADD CONSTRAINT "rental_orders_generator_id_generators_id_fk" FOREIGN KEY ("generator_id") REFERENCES "public"."generators"("id") ON DELETE set null ON UPDATE no action;
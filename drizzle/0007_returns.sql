CREATE TABLE IF NOT EXISTS "returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"return_number" varchar(50) NOT NULL,
	"order_id" integer,
	"order_number" varchar(50) NOT NULL,
	"generator_id" integer,
	"generator_code" varchar(100) NOT NULL,
	"generator_capacity" varchar(50),
	"customer_name" varchar(255) NOT NULL,
	"site_location" varchar(255) NOT NULL,
	"return_date" varchar(50) NOT NULL,
	"closing_hours" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "returns_return_number_unique" UNIQUE("return_number")
);
--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_rental_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."rental_orders"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_generator_id_generators_id_fk" FOREIGN KEY ("generator_id") REFERENCES "public"."generators"("id") ON DELETE set null ON UPDATE no action;

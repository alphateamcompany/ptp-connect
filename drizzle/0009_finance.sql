CREATE TABLE IF NOT EXISTS "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"order_id" integer,
	"order_number" varchar(50),
	"customer_id" integer,
	"customer_name" varchar(255) NOT NULL,
	"customer_gst" varchar(50),
	"issue_date" varchar(50) NOT NULL,
	"due_date" varchar(50) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"gst_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"transport_charges" numeric(10, 2) DEFAULT '0' NOT NULL,
	"additional_charges" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"balance_amount" numeric(12, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"payment_terms" varchar(100) DEFAULT 'Net 30',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);

CREATE TABLE IF NOT EXISTS "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_number" varchar(50) NOT NULL,
	"invoice_id" integer,
	"invoice_number" varchar(50),
	"customer_id" integer,
	"customer_name" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_date" varchar(50) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"reference_number" varchar(100),
	"status" varchar(50) DEFAULT 'Completed' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_payment_number_unique" UNIQUE("payment_number")
);

CREATE TABLE IF NOT EXISTS "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"expense_number" varchar(50) NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" varchar(255) NOT NULL,
	"generator_id" integer,
	"generator_name" varchar(255),
	"amount" numeric(12, 2) NOT NULL,
	"expense_date" varchar(50) NOT NULL,
	"vendor" varchar(255),
	"payment_method" varchar(50) DEFAULT 'Bank Transfer' NOT NULL,
	"status" varchar(50) DEFAULT 'Paid' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_expense_number_unique" UNIQUE("expense_number")
);

DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_rental_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."rental_orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_generator_id_generators_id_fk" FOREIGN KEY ("generator_id") REFERENCES "public"."generators"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

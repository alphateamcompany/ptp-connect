CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"gst_number" varchar(50),
	"contact_person" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"payment_terms" varchar(100) DEFAULT 'Net 30',
	"outstanding_amount" numeric(12, 2) DEFAULT '0',
	"billing_address" text,
	"site_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generators" ALTER COLUMN "capacity_kva" SET DATA TYPE numeric(8, 2);
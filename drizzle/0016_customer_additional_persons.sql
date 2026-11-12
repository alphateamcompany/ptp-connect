ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "additional_persons" jsonb DEFAULT '[]'::jsonb;

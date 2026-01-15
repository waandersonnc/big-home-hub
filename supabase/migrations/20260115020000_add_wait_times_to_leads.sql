-- Add wait time columns to leads table
ALTER TABLE "public"."leads" 
ADD COLUMN "espera_iniciada" timestamp with time zone,
ADD COLUMN "fim_da_espera" timestamp with time zone;

-- Add comment explaining usage
COMMENT ON COLUMN "public"."leads"."espera_iniciada" IS 'Timestamp when the lead entered the wait stage';
COMMENT ON COLUMN "public"."leads"."fim_da_espera" IS 'Timestamp when the wait period ends (e.g. 30 min later)';

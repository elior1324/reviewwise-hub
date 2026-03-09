-- Add unique constraint for upsert on business_integrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_integrations_business_id_integration_type_key'
  ) THEN
    ALTER TABLE public.business_integrations
    ADD CONSTRAINT business_integrations_business_id_integration_type_key
    UNIQUE (business_id, integration_type);
  END IF;
END $$;
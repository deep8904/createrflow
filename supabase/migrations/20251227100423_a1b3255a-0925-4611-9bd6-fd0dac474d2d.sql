-- Add Gmail integration fields to integrations table
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS filter_keywords TEXT[] DEFAULT ARRAY['partnership', 'collab', 'collaboration', 'sponsorship', 'sponsor', 'brand deal', 'influencer', 'campaign', 'ambassador'];

-- Add summary and extracted_data fields to deals table
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS extracted_data JSONB,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add Gmail message tracking fields to deal_messages
ALTER TABLE public.deal_messages
ADD COLUMN IF NOT EXISTS gmail_message_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT,
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ;

-- Create index for duplicate prevention
CREATE INDEX IF NOT EXISTS idx_deal_messages_gmail_message_id ON public.deal_messages(gmail_message_id) WHERE gmail_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_gmail_thread_id ON public.deals(gmail_thread_id) WHERE gmail_thread_id IS NOT NULL;
-- Add white_label JSONB column for per-restaurant customization
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS white_label JSONB DEFAULT '{}'::jsonb;

-- Add custom_domain column for own-domain support
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS custom_domain TEXT;

-- Index for looking up restaurants by custom domain
CREATE INDEX IF NOT EXISTS idx_restaurants_custom_domain ON restaurants (custom_domain) WHERE custom_domain IS NOT NULL;

-- Update RLS to allow master to read/write white_label
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Master full access on restaurants" ON restaurants;
CREATE POLICY "Master full access on restaurants" ON restaurants
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'master')
  WITH CHECK (auth.jwt() ->> 'role' = 'master');

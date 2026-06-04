-- ============================================
-- MIGRATION 012: Storage bucket para logos
-- ============================================

-- 1. Criar bucket "restaurant-assets" (público para leitura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-assets',
  'restaurant-assets',
  true,  -- público para leitura (logos aparecem no painel)
  5242880,  -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Policy: público pode LER qualquer arquivo
DROP POLICY IF EXISTS "Public read restaurant assets" ON storage.objects;
CREATE POLICY "Public read restaurant assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'restaurant-assets');

-- 3. Policy: master pode TUDO (upload/update/delete)
DROP POLICY IF EXISTS "Master full access on restaurant assets" ON storage.objects;
CREATE POLICY "Master full access on restaurant assets" ON storage.objects
  FOR ALL USING (
    bucket_id = 'restaurant-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  )
  WITH CHECK (
    bucket_id = 'restaurant-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master'
    )
  );

-- 4. Policy: owner do restaurante pode fazer upload da própria logo
DROP POLICY IF EXISTS "Owner can upload own logo" ON storage.objects;
CREATE POLICY "Owner can upload own logo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'restaurant-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'admin')
        AND (storage.foldername(name))[1] = p.restaurant_id::text
    )
  );

DROP POLICY IF EXISTS "Owner can update own logo" ON storage.objects;
CREATE POLICY "Owner can update own logo" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'restaurant-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'admin')
        AND (storage.foldername(name))[1] = p.restaurant_id::text
    )
  );

DROP POLICY IF EXISTS "Owner can delete own logo" ON storage.objects;
CREATE POLICY "Owner can delete own logo" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'restaurant-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'admin')
        AND (storage.foldername(name))[1] = p.restaurant_id::text
    )
  );

-- 5. Helper function: gera URL pública de um asset
CREATE OR REPLACE FUNCTION public.get_restaurant_asset_url(
  p_restaurant_id UUID,
  p_file_name TEXT
)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 'https://sqclpeyoimddjcrfcrmi.supabase.co/storage/v1/object/public/restaurant-assets/'
    || p_restaurant_id::text || '/' || p_file_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_restaurant_asset_url TO anon, authenticated;

-- ============================================================
-- PEDDI - FASE 2 (PARTE 4: REALTIME + STORAGE SETUP)
-- ============================================================

-- 10. REALTIME PUBLICATION
-- Add all tables to supabase_realtime publication
DO $$ BEGIN
  -- Remove existing tables first (clean slate)
  EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.restaurants';
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add tables to realtime (order matters - remove duplicates)
DO $$ BEGIN
  CREATE PUBLICATION supabase_realtime;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- We'll add tables via the Management API's realtime endpoint since ALTER PUBLICATION
-- requires specific SQL privileges that may not work here.

-- 11. STORAGE BUCKETS (via SQL)
-- Insert bucket configurations into storage.buckets
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES
  ('menu-images', 'menu-images', true, false, 5242880, '{image/png,image/jpeg,image/webp,image/gif}'),
  ('restaurant-logos', 'restaurant-logos', true, false, 2097152, '{image/png,image/jpeg,image/webp}')
ON CONFLICT (id) DO NOTHING;

-- Storage policies for menu-images
DO $$ BEGIN
  DROP POLICY IF EXISTS "menu_images_public_select" ON storage.objects;
  DROP POLICY IF EXISTS "menu_images_owner_insert" ON storage.objects;
  DROP POLICY IF EXISTS "menu_images_owner_update" ON storage.objects;
  DROP POLICY IF EXISTS "menu_images_owner_delete" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "menu_images_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "menu_images_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'menu-images'
    AND (storage.foldername(name))[1] = public.get_user_restaurant_id()::TEXT
  );

CREATE POLICY "menu_images_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'menu-images'
    AND (storage.foldername(name))[1] = public.get_user_restaurant_id()::TEXT
  );

CREATE POLICY "menu_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'menu-images'
    AND (storage.foldername(name))[1] = public.get_user_restaurant_id()::TEXT
  );

-- Storage policies for restaurant-logos
DO $$ BEGIN
  DROP POLICY IF EXISTS "logos_public_select" ON storage.objects;
  DROP POLICY IF EXISTS "logos_owner_insert" ON storage.objects;
  DROP POLICY IF EXISTS "logos_owner_update" ON storage.objects;
  DROP POLICY IF EXISTS "logos_owner_delete" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "logos_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'restaurant-logos');

CREATE POLICY "logos_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'restaurant-logos'
    AND (storage.foldername(name))[1] = public.get_user_restaurant_id()::TEXT
  );

CREATE POLICY "logos_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'restaurant-logos'
    AND (storage.foldername(name))[1] = public.get_user_restaurant_id()::TEXT
  );

CREATE POLICY "logos_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'restaurant-logos'
    AND (storage.foldername(name))[1] = public.get_user_restaurant_id()::TEXT
  );

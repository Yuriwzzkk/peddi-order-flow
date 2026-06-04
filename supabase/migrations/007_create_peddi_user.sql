-- ============================================================================
-- MIGRATION 007: Helper function to create users correctly
-- ============================================================================
-- Fix: GoTrue auth rejects users where confirmation_token, email_change,
-- email_change_token_new, email_change_token_current, recovery_token or
-- reauthentication_token are NULL. They must be empty strings ''.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_peddi_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'owner',
  p_restaurant_id UUID DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := gen_random_uuid();

  -- Delete any existing user with this email
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = p_email);
  DELETE FROM auth.users WHERE email = p_email;
  DELETE FROM public.profiles WHERE email = p_email;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, email_change, email_change_token_new, email_change_token_current, email_change_confirm_status,
    recovery_token, reauthentication_token,
    is_sso_user, is_anonymous, created_at, updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id, 'authenticated', 'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', p_email,
      'email_verified', false,
      'phone_verified', false,
      'name', p_name,
      'role', p_role,
      'restaurant_id', p_restaurant_id::text
    ),
    '', '', '', '', 0, '', '',
    false, false, now(), now()
  );

  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_user_id::text,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', false, 'phone_verified', false),
    'email',
    now(), now(), now()
  );

  INSERT INTO public.profiles (id, name, email, role, restaurant_id, type, phone)
  VALUES (v_user_id, p_name, p_email, p_role, p_restaurant_id, p_type, p_phone)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    restaurant_id = EXCLUDED.restaurant_id,
    type = EXCLUDED.type,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

  RETURN v_user_id;
END;
$$;

-- Now fix existing users that have NULL tokens
UPDATE auth.users SET
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  recovery_token = COALESCE(recovery_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0)
WHERE confirmation_token IS NULL
   OR email_change IS NULL
   OR email_change_token_new IS NULL
   OR email_change_token_current IS NULL
   OR recovery_token IS NULL
   OR reauthentication_token IS NULL;

CREATE OR REPLACE FUNCTION public.master_add_team_member(p_email TEXT, p_password TEXT, p_name TEXT, p_role TEXT DEFAULT 'master')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_profile JSON;
BEGIN
  IF public.get_user_role() != 'master' THEN
    RAISE EXCEPTION 'Apenas master pode adicionar membros';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario nao encontrado. Crie o auth user primeiro.';
  END IF;

  INSERT INTO public.profiles (id, name, email, role, type, online, updated_at)
  VALUES (v_user_id, p_name, p_email, p_role, NULL, false, now())
  ON CONFLICT (id) DO UPDATE SET
    name = p_name,
    role = p_role,
    updated_at = now();

  SELECT row_to_json(profiles.*) INTO v_profile FROM public.profiles WHERE id = v_user_id;
  RETURN json_build_object('user_id', v_user_id, 'profile', v_profile);
END;
$$;

-- Função para gerar backup lógico (export JSON) de tabelas críticas
-- Pode ser chamada via cron ou manualmente para dump
CREATE OR REPLACE FUNCTION public.export_critical_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  r_count INT;
  o_count INT;
  c_count INT;
BEGIN
  -- Apenas master pode executar
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master') THEN
    RAISE EXCEPTION 'Apenas master pode exportar';
  END IF;

  SELECT COUNT(*) INTO r_count FROM public.restaurants;
  SELECT COUNT(*) INTO o_count FROM public.orders;
  SELECT COUNT(*) INTO c_count FROM public.customers;

  SELECT json_build_object(
    'exported_at', now(),
    'exported_by', auth.uid(),
    'counts', json_build_object(
      'restaurants', r_count,
      'orders', o_count,
      'customers', c_count
    ),
    'note', 'Use supabase db dump ou pg_dump para backup completo'
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.export_critical_data TO authenticated;

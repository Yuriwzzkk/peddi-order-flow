-- ============================================
-- MIGRATION 011: Reforço de Segurança (RLS)
-- ============================================

-- 1. RLS em zapi_config: só master e owner do restaurante
ALTER TABLE public.zapi_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage zapi" ON public.zapi_config;
CREATE POLICY "Owner can manage zapi" ON public.zapi_config
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'master')
    )
  );

-- 2. RLS em restaurant_settings
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage settings" ON public.restaurant_settings;
CREATE POLICY "Owner can manage settings" ON public.restaurant_settings
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'master')
    )
  );

-- 3. RLS em n8n_webhooks
ALTER TABLE public.n8n_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage n8n" ON public.n8n_webhooks;
CREATE POLICY "Owner can manage n8n" ON public.n8n_webhooks
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'master')
    )
  );

-- 4. Bloquear escrita anônima em tabelas críticas
DROP POLICY IF EXISTS "Block anonymous writes" ON public.restaurants;
CREATE POLICY "Block anonymous writes" ON public.restaurants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Block anonymous writes orders" ON public.orders;
CREATE POLICY "Block anonymous writes orders" ON public.orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR auth.role() = 'anon');

-- 5. Audit log (opcional, leve)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Master can read audit" ON public.audit_log;
CREATE POLICY "Master can read audit" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master')
  );

-- 6. Função para registrar login attempts (chamar do client)
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_ip TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_log (action, table_name, new_data, ip_address)
  VALUES (
    CASE WHEN p_success THEN 'login_success' ELSE 'login_failed' END,
    'auth',
    jsonb_build_object('email', p_email),
    p_ip::inet
  );
END;
$$;

-- 7. Função para detectar tentativas suspeitas (>5 falhas/15min)
CREATE OR REPLACE FUNCTION public.check_suspicious_login(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  failures INT;
BEGIN
  SELECT COUNT(*) INTO failures
  FROM public.audit_log
  WHERE new_data->>'email' = p_email
    AND action = 'login_failed'
    AND created_at > now() - INTERVAL '15 minutes';

  RETURN failures >= 5;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_login_attempt TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_suspicious_login TO anon, authenticated;

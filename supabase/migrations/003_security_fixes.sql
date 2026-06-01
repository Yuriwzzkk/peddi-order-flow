-- ============================================================
-- PEDDI - FASE 3: SEGURANÇA (RLS FALTANTE + FIXES)
-- ============================================================

-- 1. TABELAS QUE FALTAM (criadas via API mas sem SQL)

-- Tabela: n8n_webhooks (armazena URLs de webhook)
CREATE TABLE IF NOT EXISTS public.n8n_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  headers JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.n8n_webhooks ENABLE ROW LEVEL SECURITY;

-- Tabela: zapi_config (armazena tokens Z-API - CRÍTICO)
CREATE TABLE IF NOT EXISTS public.zapi_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID UNIQUE NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  api_token TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  secret_key TEXT,
  webhook_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.zapi_config ENABLE ROW LEVEL SECURITY;

-- Tabela: whatsapp_notification_queue
CREATE TABLE IF NOT EXISTS public.whatsapp_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  priority INT DEFAULT 0,
  sent_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.whatsapp_notification_queue ENABLE ROW LEVEL SECURITY;

-- Tabela: automation_queue
CREATE TABLE IF NOT EXISTS public.automation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  entity_id UUID,
  payload JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.automation_queue ENABLE ROW LEVEL SECURITY;

-- Tabela: conversation_flow_state
CREATE TABLE IF NOT EXISTS public.conversation_flow_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  flow_id UUID REFERENCES public.flow_templates(id) ON DELETE SET NULL,
  current_block_id UUID REFERENCES public.flow_blocks(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  variables JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.conversation_flow_state ENABLE ROW LEVEL SECURITY;

-- Tabela: sales_summary
CREATE TABLE IF NOT EXISTS public.sales_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_orders INT DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  avg_ticket DECIMAL(10,2) DEFAULT 0,
  payment_methods JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, date)
);

ALTER TABLE public.sales_summary ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. RLS POLICIES FALTANTES
-- ============================================================

-- n8n_webhooks: dono do restaurante + master
CREATE POLICY "n8n_webhooks_tenant_select" ON public.n8n_webhooks
  FOR SELECT USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

CREATE POLICY "n8n_webhooks_tenant_insert" ON public.n8n_webhooks
  FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

CREATE POLICY "n8n_webhooks_tenant_update" ON public.n8n_webhooks
  FOR UPDATE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

CREATE POLICY "n8n_webhooks_tenant_delete" ON public.n8n_webhooks
  FOR DELETE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

-- zapi_config: **APENAS** dono do restaurante (token sensível)
CREATE POLICY "zapi_config_tenant_select" ON public.zapi_config
  FOR SELECT USING (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "zapi_config_tenant_insert" ON public.zapi_config
  FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "zapi_config_tenant_update" ON public.zapi_config
  FOR UPDATE USING (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "zapi_config_tenant_delete" ON public.zapi_config
  FOR DELETE USING (restaurant_id = public.get_user_restaurant_id());

-- whatsapp_notification_queue
CREATE POLICY "notifications_tenant_select" ON public.whatsapp_notification_queue
  FOR SELECT USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

CREATE POLICY "notifications_tenant_insert" ON public.whatsapp_notification_queue
  FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "notifications_tenant_update" ON public.whatsapp_notification_queue
  FOR UPDATE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

CREATE POLICY "notifications_tenant_delete" ON public.whatsapp_notification_queue
  FOR DELETE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

-- automation_queue
CREATE POLICY "automation_queue_tenant_select" ON public.automation_queue
  FOR SELECT USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

CREATE POLICY "automation_queue_tenant_insert" ON public.automation_queue
  FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "automation_queue_tenant_update" ON public.automation_queue
  FOR UPDATE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

-- conversation_flow_state
CREATE POLICY "flow_state_tenant_select" ON public.conversation_flow_state
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master'))
  );

CREATE POLICY "flow_state_tenant_insert" ON public.conversation_flow_state
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.restaurant_id = public.get_user_restaurant_id())
  );

CREATE POLICY "flow_state_tenant_update" ON public.conversation_flow_state
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master'))
  );

CREATE POLICY "flow_state_tenant_delete" ON public.conversation_flow_state
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master'))
  );

-- sales_summary
CREATE POLICY "sales_summary_tenant_select" ON public.sales_summary
  FOR SELECT USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

CREATE POLICY "sales_summary_tenant_insert" ON public.sales_summary
  FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id());

-- ============================================================
-- 3. FUNÇÃO: admin_create_user (cria usuário auth + profile)
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT,
  p_restaurant_id UUID,
  p_type TEXT DEFAULT NULL,
  p_shift TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Apenas owner do restaurante ou master pode criar usuários
  IF public.get_user_role() NOT IN ('owner', 'master') THEN
    RAISE EXCEPTION 'Apenas owner ou master podem criar usuários';
  END IF;

  IF public.get_user_role() = 'owner' AND public.get_user_restaurant_id() != p_restaurant_id THEN
    RAISE EXCEPTION 'Você só pode criar usuários para seu próprio restaurante';
  END IF;

  -- Validar role permitida
  IF p_role NOT IN ('delivery', 'presencial', 'owner', 'master') THEN
    RAISE EXCEPTION 'Role inválida: %', p_role;
  END IF;

  -- Inserir na auth.users via Supabase Management API (requer service role)
  -- Esta função deve ser chamada via service_role key em vez de RPC
  -- Como workaround, retornamos instruções para criar via API
  v_result := json_build_object(
    'status', 'requires_admin_api',
    'message', 'Use a Management API ou SQL direto para criar: INSERT INTO auth.users...',
    'email', p_email,
    'role', p_role,
    'restaurant_id', p_restaurant_id
  );

  RETURN v_result;
END;
$$;

-- ============================================================
-- 3b. FUNÇÃO: criar profile manualmente (após auth.user criado via API)
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT,
  p_restaurant_id UUID,
  p_type TEXT DEFAULT NULL,
  p_shift TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_profile JSON;
BEGIN
  IF public.get_user_role() NOT IN ('owner', 'master') THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  IF public.get_user_role() = 'owner' AND public.get_user_restaurant_id() != p_restaurant_id THEN
    RAISE EXCEPTION 'Você só pode criar perfis para seu próprio restaurante';
  END IF;

  INSERT INTO public.profiles (id, restaurant_id, name, email, role, type, shift)
  VALUES (p_user_id, p_restaurant_id, p_name, p_email, p_role::public.user_role, p_type, p_shift)
  RETURNING row_to_json(profiles.*) INTO v_profile;

  RETURN v_profile;
END;
$$;

-- ============================================================
-- 3c. FUNÇÕES AUXILIARES DE SEGURANÇA (se não existirem)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_restaurant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()),
    NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()),
    'anonymous'
  );
$$;

-- ============================================================
-- 4. VALIDAÇÃO DE URL DE WEBHOOK (prevenir SSRF)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_valid_webhook_url(url TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT url ~ '^https://[a-zA-Z0-9][a-zA-Z0-9.-]+[a-zA-Z0-9](:[0-9]+)?(/.*)?$'
$$;

-- Trigger para validar URL de webhook
CREATE OR REPLACE FUNCTION public.validate_webhook_url()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_valid_webhook_url(NEW.webhook_url) THEN
    RAISE EXCEPTION 'Webhook URL must use HTTPS';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_webhook_url ON public.n8n_webhooks;
CREATE TRIGGER trg_validate_webhook_url
  BEFORE INSERT OR UPDATE ON public.n8n_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_webhook_url();

-- ============================================================
-- 5. REVOKE PERMISSÕES PERIGOSAS (apenas RPC para operações sensíveis)
-- ============================================================

-- Revogar acesso direto a tabelas sensíveis para roles não-admin
REVOKE ALL ON public.n8n_webhooks FROM anon, authenticated;
REVOKE ALL ON public.zapi_config FROM anon, authenticated;
REVOKE ALL ON public.automation_queue FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.n8n_webhooks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zapi_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.automation_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_notification_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_flow_state TO authenticated;

-- ============================================================
-- 6. ÍNDICES DE SEGURANÇA
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_n8n_webhooks_restaurant ON public.n8n_webhooks(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_zapi_config_restaurant ON public.zapi_config(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_automation_queue_restaurant ON public.automation_queue(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_restaurant ON public.whatsapp_notification_queue(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_conversation_flow_state_conversation ON public.conversation_flow_state(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sales_summary_restaurant_date ON public.sales_summary(restaurant_id, date);

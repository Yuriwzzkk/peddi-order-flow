-- ============================================
-- MIGRATION 009: Multi-tenant + Pagamentos SyncPay
-- ============================================

-- Helper function para updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tabela de pagamentos (checkout do site)
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identificador retornado pela SyncPay
  identifier TEXT UNIQUE,
  -- Dados do cliente que está comprando
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_cpf TEXT NOT NULL,
  -- Dados do pedido
  restaurant_name TEXT NOT NULL,
  restaurant_slug TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro')),
  amount NUMERIC(10, 2) NOT NULL,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunded')),
  -- Dados SyncPay
  pix_code TEXT,
  -- Referência ao restaurant criado
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  -- Webhook payload
  webhook_data JSONB,
  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_identifier ON public.payment_intents(identifier);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON public.payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_email ON public.payment_intents(customer_email);

-- RLS para payment_intents
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

-- Apenas master pode ver
DROP POLICY IF EXISTS "Master can view all payments" ON public.payment_intents;
CREATE POLICY "Master can view all payments" ON public.payment_intents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master')
  );

-- Service role pode inserir/atualizar (edge functions)
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payment_intents;
CREATE POLICY "Service role can manage payments" ON public.payment_intents
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_payment_intents_updated_at ON public.payment_intents;
CREATE TRIGGER trg_payment_intents_updated_at
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- Tabela de configurações do SaaS (master)
-- ============================================
CREATE TABLE IF NOT EXISTS public.saas_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Configurações iniciais
INSERT INTO public.saas_settings (key, value, description) VALUES
  ('master_whatsapp', '"5511999999999"'::jsonb, 'Número do master para enviar acessos'),
  ('master_email', '"master@peddi.com.br"'::jsonb, 'Email do master'),
  ('plan_starter_price', '97'::jsonb, 'Preço do plano Starter'),
  ('plan_pro_price', '197'::jsonb, 'Preço do plano Pro'),
  ('webhook_base_url', '""'::jsonb, 'URL base para webhooks (configurar após deploy)'),
  ('n8n_prompt_template', '""'::jsonb, 'Template do prompt para IA gerar n8n JSON')
ON CONFLICT (key) DO NOTHING;

-- Apenas master pode ler
ALTER TABLE public.saas_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Master can manage saas settings" ON public.saas_settings;
CREATE POLICY "Master can manage saas settings" ON public.saas_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master')
  );

-- ============================================
-- Adicionar campos para multi-tenant
-- ============================================
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS use_custom_domain BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_intent_id UUID REFERENCES public.payment_intents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_custom_domain ON public.restaurants(custom_domain) WHERE custom_domain IS NOT NULL;

-- ============================================
-- RPC: Detectar tenant por domínio
-- ============================================
CREATE OR REPLACE FUNCTION public.get_tenant_by_domain(p_domain TEXT)
RETURNS TABLE(
  id UUID,
  name TEXT,
  slug TEXT,
  logo_url TEXT,
  white_label JSONB,
  whatsapp_number TEXT,
  primary_color TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.slug,
    r.logo_url,
    r.white_label,
    r.whatsapp_number,
    COALESCE((r.white_label->>'primary_color')::TEXT, '#FF6B2C') as primary_color
  FROM public.restaurants r
  WHERE
    -- Match por custom domain
    (r.use_custom_domain = true AND r.custom_domain = p_domain AND r.domain_verified = true)
    -- OU match por slug subdomain
    OR r.slug = SPLIT_PART(p_domain, '.', 1)
  LIMIT 1;
END;
$$;

-- ============================================
-- RPC: Atualizar status do payment_intent
-- ============================================
CREATE OR REPLACE FUNCTION public.update_payment_intent_status(
  p_identifier TEXT,
  p_status TEXT,
  p_webhook_data JSONB DEFAULT NULL
)
RETURNS public.payment_intents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result public.payment_intents;
BEGIN
  UPDATE public.payment_intents
  SET
    status = p_status,
    webhook_data = COALESCE(p_webhook_data, webhook_data),
    paid_at = CASE WHEN p_status = 'paid' THEN now() ELSE paid_at END,
    updated_at = now()
  WHERE identifier = p_identifier
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment intent not found for identifier %', p_identifier;
  END IF;

  -- Se foi pago, criar o restaurante
  IF p_status = 'paid' AND result.restaurant_id IS NULL THEN
    INSERT INTO public.restaurants (
      name,
      slug,
      email,
      phone,
      whatsapp_number,
      plan,
      active,
      payment_intent_id,
      trial_ends,
      painel_configurado
    ) VALUES (
      result.restaurant_name,
      result.restaurant_slug,
      result.customer_email,
      result.customer_phone,
      result.customer_phone,
      result.plan,
      true,
      result.id,
      now() + INTERVAL '3 days',
      false
    )
    RETURNING id INTO result.restaurant_id;

    UPDATE public.payment_intents
    SET restaurant_id = result.restaurant_id
    WHERE id = result.id;
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_by_domain TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_intent_status TO service_role;

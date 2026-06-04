-- Migration 016: Tabela subscriptions para tracking de MRR/churn
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'past_due')),
  amount NUMERIC(10,2) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  payment_intent_id UUID REFERENCES public.payment_intents(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON public.subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.subscriptions(status) WHERE status = 'active';

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Master pode ver tudo
DROP POLICY IF EXISTS "Master full access subscriptions" ON public.subscriptions;
CREATE POLICY "Master full access subscriptions" ON public.subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master')
  );

-- Owners podem ver a própria subscription
DROP POLICY IF EXISTS "Owner read own subscription" ON public.subscriptions;
CREATE POLICY "Owner read own subscription" ON public.subscriptions
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_subscriptions_updated ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Função que cria subscription a partir de payment_intent
CREATE OR REPLACE FUNCTION public.create_subscription_from_payment(
  p_payment_intent_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pi RECORD;
  sub_id UUID;
  amount NUMERIC;
BEGIN
  -- Buscar payment intent
  SELECT * INTO pi FROM public.payment_intents WHERE id = p_payment_intent_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment intent não encontrado: %', p_payment_intent_id;
  END IF;

  -- Calcular amount baseado no plano
  amount := CASE pi.plan WHEN 'pro' THEN 197.00 ELSE 97.00 END;

  -- Criar subscription
  INSERT INTO public.subscriptions (
    restaurant_id, plan, status, amount,
    started_at, current_period_start, current_period_end,
    payment_intent_id
  ) VALUES (
    pi.restaurant_id, pi.plan, 'active', amount,
    now(), now(), now() + INTERVAL '30 days',
    p_payment_intent_id
  ) RETURNING id INTO sub_id;

  RETURN sub_id;
END;
$$;

-- View materializada para MRR
CREATE OR REPLACE VIEW public.mrr_summary AS
SELECT
  -- MRR atual: soma de amount de subscriptions ativas
  COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END), 0) AS mrr,
  -- ARR: MRR * 12
  COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END), 0) * 12 AS arr,
  -- Total de clientes ativos
  COUNT(DISTINCT CASE WHEN status = 'active' THEN restaurant_id END) AS active_customers,
  -- Total de clientes em qualquer status
  COUNT(DISTINCT restaurant_id) AS total_customers,
  -- Clientes Starter
  COUNT(DISTINCT CASE WHEN plan = 'starter' AND status = 'active' THEN restaurant_id END) AS starter_count,
  -- Clientes Pro
  COUNT(DISTINCT CASE WHEN plan = 'pro' AND status = 'active' THEN restaurant_id END) AS pro_count,
  -- Receita Starter
  COALESCE(SUM(CASE WHEN plan = 'starter' AND status = 'active' THEN amount ELSE 0 END), 0) AS starter_revenue,
  -- Receita Pro
  COALESCE(SUM(CASE WHEN plan = 'pro' AND status = 'active' THEN amount ELSE 0 END), 0) AS pro_revenue
FROM public.subscriptions;

GRANT SELECT ON public.mrr_summary TO authenticated;

-- Função para listar subscriptions com info do restaurante
CREATE OR REPLACE FUNCTION public.get_subscriptions_summary()
RETURNS TABLE(
  id UUID,
  restaurant_id UUID,
  restaurant_name TEXT,
  restaurant_slug TEXT,
  plan TEXT,
  status TEXT,
  amount NUMERIC,
  started_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    s.id,
    s.restaurant_id,
    r.name,
    r.slug,
    s.plan,
    s.status,
    s.amount,
    s.started_at,
    s.current_period_end,
    s.cancelled_at
  FROM public.subscriptions s
  JOIN public.restaurants r ON r.id = s.restaurant_id
  WHERE EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master')
  ORDER BY s.started_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_subscriptions_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_subscription_from_payment TO service_role;

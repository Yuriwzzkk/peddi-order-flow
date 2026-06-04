-- Migration 017: Torna create_subscription_from_payment idempotente via UNIQUE em payment_intent_id
-- e ON CONFLICT (já executado em partes: dedupe + unique constraint)

-- Atualiza função para usar ON CONFLICT corretamente
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

  -- Idempotente: ON CONFLICT retorna o ID existente
  INSERT INTO public.subscriptions (
    restaurant_id, plan, status, amount,
    started_at, current_period_start, current_period_end,
    payment_intent_id
  ) VALUES (
    pi.restaurant_id, pi.plan, 'active', amount,
    now(), now(), now() + INTERVAL '30 days',
    p_payment_intent_id
  )
  ON CONFLICT (payment_intent_id) DO UPDATE
    SET updated_at = now()
  RETURNING id INTO sub_id;

  RETURN sub_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_subscription_from_payment TO service_role;

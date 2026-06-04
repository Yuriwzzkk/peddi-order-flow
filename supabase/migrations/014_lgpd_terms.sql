-- Adiciona campo de aceite de termos em payment_intents (LGPD)
ALTER TABLE public.payment_intents
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT 'v1.0';

-- Função helper para verificar se pagamento aceitou termos
CREATE OR REPLACE FUNCTION public.payment_intent_has_terms(p_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT terms_accepted_at IS NOT NULL
  FROM public.payment_intents
  WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION public.payment_intent_has_terms TO anon, authenticated;

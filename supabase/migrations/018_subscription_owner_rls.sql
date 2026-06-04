-- Migration 018: Permitir owner atualizar status da própria subscription (pausar/cancelar)
-- Master pode fazer tudo (já existe)
DROP POLICY IF EXISTS "Owner can update own subscription" ON public.subscriptions;
CREATE POLICY "Owner can update own subscription" ON public.subscriptions
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

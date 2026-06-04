-- Migration 015: Adicionar coluna onboarding_completed em restaurants
-- Usado para detectar se o admin já fez o wizard inicial
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Marcar restaurantes que já tem cardápio ou categorias como "onboarded"
UPDATE public.restaurants r
SET onboarding_completed = true
WHERE EXISTS (
  SELECT 1 FROM public.menu_items mi WHERE mi.restaurant_id = r.id LIMIT 1
) OR EXISTS (
  SELECT 1 FROM public.menu_categories mc WHERE mc.restaurant_id = r.id LIMIT 1
);

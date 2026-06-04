-- Migration 010: Corrigir trigger trg_auto_provision_restaurant
-- (table flow_templates não existe, então o trigger falha)

-- Table já existe com categorias: atendimento, vendas, recuperacao, upsell, marketing, custom
-- Inserir templates padrão (se ainda não existirem)
INSERT INTO public.flow_templates (name, description, category) VALUES
  ('Atendimento Inicial', 'Mensagem de boas-vindas para novos clientes', 'atendimento'),
  ('Confirmacao de Pedido', 'Confirma pedido automaticamente', 'vendas'),
  ('Status do Pedido', 'Notifica mudança de status', 'vendas'),
  ('Carrinho Abandonado', 'Recupera carrinho', 'recuperacao')
ON CONFLICT DO NOTHING;

-- Recriar a função de auto provisionamento com tratamento de erro
CREATE OR REPLACE FUNCTION public.trg_auto_provision_restaurant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_template_id UUID; v_flow_id UUID;
BEGIN
  -- Inserir configurações padrão
  INSERT INTO public.restaurant_settings (restaurant_id, business_hours, working_days, payment_methods, notifications)
  VALUES (
    NEW.id,
    '{"abre": "10:00", "fecha": "23:00"}'::jsonb,
    ARRAY['Seg','Ter','Qua','Qui','Sex','Sab','Dom'],
    ARRAY['pix','card','cash'],
    '{"push": true, "email": false, "whatsapp": true}'::jsonb
  )
  ON CONFLICT (restaurant_id) DO NOTHING;

  -- Tentar clonar templates (se a função existir)
  BEGIN
    SELECT id INTO v_template_id FROM public.flow_templates WHERE name = 'Atendimento Inicial' LIMIT 1;
    IF v_template_id IS NOT NULL AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'clone_flow_template') THEN
      v_flow_id := public.clone_flow_template(v_template_id, NEW.id, true);
      IF v_flow_id IS NOT NULL THEN
        UPDATE public.automation_flows SET config = jsonb_build_object('trigger_event', 'new_conversation')
        WHERE id = v_flow_id;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Silenciar erros de provisionamento
    RAISE WARNING 'Auto-provision flow template falhou: %', SQLERRM;
  END;

  BEGIN
    SELECT id INTO v_template_id FROM public.flow_templates WHERE name = 'Confirmacao de Pedido' LIMIT 1;
    IF v_template_id IS NOT NULL AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'clone_flow_template') THEN
      v_flow_id := public.clone_flow_template(v_template_id, NEW.id, true);
      IF v_flow_id IS NOT NULL THEN
        UPDATE public.automation_flows SET config = jsonb_build_object('trigger_event', 'order_created')
        WHERE id = v_flow_id;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Auto-provision confirm template falhou: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

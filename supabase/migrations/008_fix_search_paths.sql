-- ============================================================================
-- MIGRATION 008: Fix all search_path issues + missing triggers
-- ============================================================================
-- Many functions have SET search_path TO '' which requires fully qualified
-- table names. We're going to change them all to use 'public' search_path.

-- 1. Fix update_order_status
CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id uuid, p_new_status text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_order RECORD;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  UPDATE public.orders SET status = p_new_status, updated_at = now() WHERE id = p_order_id;
  RETURN row_to_json(v_order)::jsonb;
END;
$function$;

-- 2. Fix trg_notify_order_status to use public.customers
CREATE OR REPLACE FUNCTION public.trg_notify_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_phone TEXT; v_msg TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT phone INTO v_phone FROM public.customers WHERE id = NEW.customer_id;
    IF v_phone IS NULL THEN RETURN NEW; END IF;
    v_msg := CASE NEW.status
      WHEN 'confirmed' THEN E'Pedido Confirmado!\nSeu pedido foi confirmado.'
      WHEN 'preparing' THEN E'Pedido em Preparo\nSeu pedido esta sendo preparado.'
      WHEN 'ready' THEN E'Pedido Pronto!\nSeu pedido esta pronto.'
      WHEN 'delivery' THEN E'Saiu para Entrega\nSeu pedido saiu para entrega.'
      WHEN 'completed' THEN E'Pedido Entregue!\nBom apetite!'
      WHEN 'cancelled' THEN E'Pedido Cancelado'
      ELSE 'Status: ' || NEW.status
    END;
    PERFORM public.send_whatsapp_notification(NEW.restaurant_id, v_phone, v_msg, 'order_status', NULL,
      jsonb_build_object('order_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Fix trg_notify_delivery_assigned
CREATE OR REPLACE FUNCTION public.trg_notify_delivery_assigned()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_phone TEXT;
BEGIN
  IF NEW.delivery_person_id IS NOT NULL
     AND (OLD.delivery_person_id IS NULL OR OLD.delivery_person_id IS DISTINCT FROM NEW.delivery_person_id) THEN
    SELECT phone INTO v_phone FROM public.profiles WHERE id = NEW.delivery_person_id;
    IF v_phone IS NOT NULL THEN
      PERFORM public.send_whatsapp_notification(NEW.restaurant_id, v_phone,
        E'Nova Entrega\nPedido: ' || NEW.id::text || E'\nEndereco: ' || COALESCE(NEW.delivery_address,''),
        'delivery_assigned', NULL, jsonb_build_object('order_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Fix send_whatsapp_notification to use public tables
CREATE OR REPLACE FUNCTION public.send_whatsapp_notification(p_restaurant_id uuid, p_recipient_phone text, p_message text, p_type text DEFAULT 'custom'::text, p_conversation_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.whatsapp_notification_queue (restaurant_id, conversation_id, recipient_phone, message, notification_type, metadata)
  VALUES (p_restaurant_id, p_conversation_id, p_recipient_phone, p_message, p_type, p_metadata) RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;

-- 5. Fix trg_process_flow_on_message
CREATE OR REPLACE FUNCTION public.trg_process_flow_on_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.process_flow_input(NEW.conversation_id, NEW.text);
  RETURN NEW;
END;
$function$;

-- 6. Fix trg_auto_provision_restaurant
CREATE OR REPLACE FUNCTION public.trg_auto_provision_restaurant()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_template_id UUID; v_flow_id UUID;
BEGIN
  INSERT INTO public.restaurant_settings (restaurant_id, business_hours, working_days, payment_methods, notifications)
  VALUES (
    NEW.id,
    '{"abre": "10:00", "fecha": "23:00"}'::jsonb,
    ARRAY['Seg','Ter','Qua','Qui','Sex','Sab','Dom'],
    ARRAY['pix','card','cash'],
    '{"push": true, "email": false, "whatsapp": true}'::jsonb
  );

  SELECT id INTO v_template_id FROM public.flow_templates WHERE name = 'Atendimento Inicial' LIMIT 1;
  IF v_template_id IS NOT NULL THEN
    v_flow_id := public.clone_flow_template(v_template_id, NEW.id, true);
    UPDATE public.automation_flows SET config = jsonb_build_object('trigger_event', 'new_conversation')
    WHERE id = v_flow_id;
  END IF;

  SELECT id INTO v_template_id FROM public.flow_templates WHERE name = 'Confirmacao de Pedido' LIMIT 1;
  IF v_template_id IS NOT NULL THEN
    v_flow_id := public.clone_flow_template(v_template_id, NEW.id, true);
    UPDATE public.automation_flows SET config = jsonb_build_object('trigger_event', 'order_created')
    WHERE id = v_flow_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- 7. Re-attach missing triggers
DROP TRIGGER IF EXISTS trg_notify_order_status_trigger ON orders;
CREATE TRIGGER trg_notify_order_status_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trg_notify_order_status();

DROP TRIGGER IF EXISTS trg_notify_delivery_assigned_trigger ON orders;
CREATE TRIGGER trg_notify_delivery_assigned_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trg_notify_delivery_assigned();

DROP TRIGGER IF EXISTS trg_process_flow_on_message_trigger ON messages;
CREATE TRIGGER trg_process_flow_on_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trg_process_flow_on_message();

DROP TRIGGER IF EXISTS queue_order_status_changed_trigger ON orders;
CREATE TRIGGER queue_order_status_changed_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION queue_order_status_changed();

DROP TRIGGER IF EXISTS queue_order_created_trigger ON orders;
CREATE TRIGGER queue_order_created_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION queue_order_created();

DROP TRIGGER IF EXISTS queue_new_conversation_trigger ON conversations;
CREATE TRIGGER queue_new_conversation_trigger
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION queue_new_conversation();

DROP TRIGGER IF EXISTS queue_new_customer_trigger ON customers;
CREATE TRIGGER queue_new_customer_trigger
  AFTER INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION queue_new_customer();

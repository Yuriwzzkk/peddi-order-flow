-- ============================================================================
-- MIGRATION 006: Backend fixes for admin/delivery/presencial panels
-- ============================================================================
-- Fixes:
-- 1. assign_delivery_safe: 'delivering' -> 'delivery' (matches schema + frontend)
-- 2. create complete_delivery_safe RPC (was missing)
-- 3. Fix trg_notify_order_status: use 'delivery' and 'completed' (correct schema)
-- 4. Fix trg_notify_delivery_assigned: use 'delivery' status label
-- ============================================================================

-- 1. Fix assign_delivery_safe
CREATE OR REPLACE FUNCTION public.assign_delivery_safe(p_order_id uuid, p_delivery_person_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_order RECORD;
BEGIN
  SELECT * INTO v_order FROM orders
  WHERE id = p_order_id AND status IN ('ready','preparing','confirmed');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or invalid status';
  END IF;

  UPDATE orders SET
    delivery_person_id = p_delivery_person_id,
    status = CASE WHEN v_order.status = 'ready' THEN 'delivery' ELSE v_order.status END,
    updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO delivery_tracking (order_id, delivery_person_id, status, address_snapshot)
  VALUES (p_order_id, p_delivery_person_id, 'assigned', v_order.delivery_address);

  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  RETURN row_to_json(v_order)::jsonb;
END;
$function$;

-- 2. Create complete_delivery_safe RPC
CREATE OR REPLACE FUNCTION public.complete_delivery_safe(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_order RECORD; v_user_role TEXT;
BEGIN
  -- Get caller role
  SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();
  IF v_user_role NOT IN ('delivery','owner','master') THEN
    RAISE EXCEPTION 'Only delivery, owner or master can complete deliveries';
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status NOT IN ('delivery','ready') THEN
    RAISE EXCEPTION 'Order must be in delivery or ready status, current: %', v_order.status;
  END IF;

  -- Update order to completed
  UPDATE orders SET
    status = 'completed',
    updated_at = now()
  WHERE id = p_order_id;

  -- Mark delivery tracking as completed
  UPDATE delivery_tracking SET
    status = 'completed',
    completed_at = now()
  WHERE order_id = p_order_id
    AND delivery_person_id = v_order.delivery_person_id
    AND completed_at IS NULL;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  RETURN row_to_json(v_order)::jsonb;
END;
$function$;

-- 3. Fix trg_notify_order_status to use correct status values
CREATE OR REPLACE FUNCTION public.trg_notify_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_phone TEXT; v_msg TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT phone INTO v_phone FROM customers WHERE id = NEW.customer_id;
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
    PERFORM send_whatsapp_notification(NEW.restaurant_id, v_phone, v_msg, 'order_status', NULL,
      jsonb_build_object('order_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Fix trg_notify_delivery_assigned
CREATE OR REPLACE FUNCTION public.trg_notify_delivery_assigned()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_phone TEXT;
BEGIN
  IF NEW.delivery_person_id IS NOT NULL
     AND (OLD.delivery_person_id IS NULL OR OLD.delivery_person_id IS DISTINCT FROM NEW.delivery_person_id) THEN
    SELECT phone INTO v_phone FROM profiles WHERE id = NEW.delivery_person_id;
    IF v_phone IS NOT NULL THEN
      PERFORM send_whatsapp_notification(NEW.restaurant_id, v_phone,
        E'Nova Entrega\nPedido: ' || NEW.id::text || E'\nEndereco: ' || COALESCE(NEW.delivery_address,''),
        'delivery_assigned', NULL, jsonb_build_object('order_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 5. Re-attach trg_notify_order_status trigger (it may have been dropped)
DROP TRIGGER IF EXISTS trg_notify_order_status_trigger ON orders;
CREATE TRIGGER trg_notify_order_status_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trg_notify_order_status();

-- 6. Re-attach trg_notify_delivery_assigned trigger
DROP TRIGGER IF EXISTS trg_notify_delivery_assigned_trigger ON orders;
CREATE TRIGGER trg_notify_delivery_assigned_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trg_notify_delivery_assigned();

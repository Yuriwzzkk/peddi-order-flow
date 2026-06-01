-- ============================================================
-- PEDDI - FASE 2 (PARTE 3: TRIGGERS + FUNCTIONS + INDEXES)
-- ============================================================

-- 7. TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trg_restaurants_updated_at ON restaurants;
CREATE TRIGGER trg_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_automation_flows_updated_at ON automation_flows;
CREATE TRIGGER trg_automation_flows_updated_at
  BEFORE UPDATE ON automation_flows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_restaurant_settings_updated_at ON restaurant_settings;
CREATE TRIGGER trg_restaurant_settings_updated_at
  BEFORE UPDATE ON restaurant_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_delivery_tracking_updated_at ON delivery_tracking;
CREATE TRIGGER trg_delivery_tracking_updated_at
  BEFORE UPDATE ON delivery_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_peddi_team_updated_at ON peddi_team;
CREATE TRIGGER trg_peddi_team_updated_at
  BEFORE UPDATE ON peddi_team
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. DATABASE FUNCTIONS

-- Admin Dashboard: get dashboard stats for a restaurant
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_restaurant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_orders', (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = p_restaurant_id AND created_at >= NOW() - INTERVAL '30 days'),
    'total_revenue', (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE restaurant_id = p_restaurant_id AND status IN ('completed', 'delivery') AND created_at >= NOW() - INTERVAL '30 days'),
    'total_customers', (SELECT COUNT(*) FROM public.customers WHERE restaurant_id = p_restaurant_id),
    'active_conversations', (SELECT COUNT(*) FROM public.conversations WHERE restaurant_id = p_restaurant_id AND status = 'open'),
    'pending_orders', (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = p_restaurant_id AND status IN ('new', 'confirmed', 'preparing')),
    'today_orders', (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = p_restaurant_id AND created_at::date = CURRENT_DATE),
    'today_revenue', (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE restaurant_id = p_restaurant_id AND created_at::date = CURRENT_DATE AND status IN ('completed', 'delivery')),
    'avg_order_value', (SELECT COALESCE(AVG(total), 0) FROM public.orders WHERE restaurant_id = p_restaurant_id AND created_at >= NOW() - INTERVAL '30 days' AND status IN ('completed', 'delivery')),
    'recent_orders', (SELECT jsonb_agg(jsonb_build_object('id', o.id, 'customer_name', o.customer_name, 'total', o.total, 'status', o.status, 'created_at', o.created_at) ORDER BY o.created_at DESC) FROM public.orders o WHERE o.restaurant_id = p_restaurant_id ORDER BY o.created_at DESC LIMIT 10)
  ) INTO result;
  RETURN result;
END;
$$;

-- Master Panel: get global platform stats
CREATE OR REPLACE FUNCTION public.get_global_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_restaurants', (SELECT COUNT(*) FROM public.restaurants WHERE active = true),
    'total_orders_today', (SELECT COUNT(*) FROM public.orders WHERE created_at::date = CURRENT_DATE),
    'total_revenue_today', (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE created_at::date = CURRENT_DATE AND status IN ('completed', 'delivery')),
    'total_customers', (SELECT COUNT(*) FROM public.customers),
    'trial_restaurants', (SELECT COUNT(*) FROM public.restaurants WHERE plan = 'starter'),
    'pro_restaurants', (SELECT COUNT(*) FROM public.restaurants WHERE plan = 'pro'),
    'active_deliveries', (SELECT COUNT(*) FROM public.delivery_tracking WHERE status IN ('assigned', 'picked_up', 'in_transit')),
    'recent_signups', (SELECT jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'plan', r.plan, 'created_at', r.created_at)) FROM (SELECT id, name, plan, created_at FROM public.restaurants ORDER BY created_at DESC LIMIT 10) r)
  ) INTO result;
  RETURN result;
END;
$$;

-- Delivery Panel: get delivery person stats
CREATE OR REPLACE FUNCTION public.get_delivery_stats(p_delivery_person_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_deliveries', (SELECT COUNT(*) FROM public.orders WHERE delivery_person_id = p_delivery_person_id),
    'completed_today', (SELECT COUNT(*) FROM public.orders WHERE delivery_person_id = p_delivery_person_id AND status = 'completed' AND created_at::date = CURRENT_DATE),
    'current_deliveries', (SELECT COUNT(*) FROM public.orders WHERE delivery_person_id = p_delivery_person_id AND status IN ('ready', 'delivery')),
    'total_distance', (SELECT COALESCE(SUM(0), 0)::INT), -- Placeholder for GPS-based distance
    'avg_delivery_time', (SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (dt.completed_at - dt.started_at))/60), 0)::INT FROM public.delivery_tracking dt WHERE dt.delivery_person_id = p_delivery_person_id AND dt.completed_at IS NOT NULL)
  ) INTO result;
  RETURN result;
END;
$$;

-- Auto-update customer status and totals on order completion
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.customers
    SET
      total_orders = total_orders + 1,
      total_spent = total_spent + COALESCE(NEW.total, 0),
      last_order_at = NOW(),
      status = CASE
        WHEN total_orders >= 5 THEN 'recorrente'
        ELSE 'novo'
      END
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_update_customer ON orders;
CREATE TRIGGER trg_orders_update_customer
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.update_customer_stats();

-- Audit log function (insert into audit_logs)
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
  );
  RETURN NULL;
END;
$$;

-- 9. INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_person ON orders(delivery_person_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_date ON orders(created_at::date);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_person ON delivery_tracking(delivery_person_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);

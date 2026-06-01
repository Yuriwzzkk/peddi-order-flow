-- ============================================================
-- PEDDI - FASE 2: BACKEND COMPLETO (PARTE 2: RLS POLICIES)
-- ============================================================

-- 6. DROP E RECRIA TODAS AS POLICIES (IDEMPOTENT)
DO $$ BEGIN
  DROP POLICY IF EXISTS "restaurants_owner_select" ON restaurants;
  DROP POLICY IF EXISTS "restaurants_owner_insert" ON restaurants;
  DROP POLICY IF EXISTS "restaurants_owner_update" ON restaurants;
  DROP POLICY IF EXISTS "restaurants_owner_delete" ON restaurants;
  DROP POLICY IF EXISTS "profiles_select" ON profiles;
  DROP POLICY IF EXISTS "profiles_insert" ON profiles;
  DROP POLICY IF EXISTS "profiles_update" ON profiles;
  DROP POLICY IF EXISTS "profiles_delete" ON profiles;
  DROP POLICY IF EXISTS "tenant_select" ON menu_categories;
  DROP POLICY IF EXISTS "tenant_insert" ON menu_categories;
  DROP POLICY IF EXISTS "tenant_update" ON menu_categories;
  DROP POLICY IF EXISTS "tenant_delete" ON menu_categories;
  DROP POLICY IF EXISTS "tenant_select" ON menu_items;
  DROP POLICY IF EXISTS "tenant_insert" ON menu_items;
  DROP POLICY IF EXISTS "tenant_update" ON menu_items;
  DROP POLICY IF EXISTS "tenant_delete" ON menu_items;
  DROP POLICY IF EXISTS "tenant_select" ON customers;
  DROP POLICY IF EXISTS "tenant_insert" ON customers;
  DROP POLICY IF EXISTS "tenant_update" ON customers;
  DROP POLICY IF EXISTS "tenant_delete" ON customers;
  DROP POLICY IF EXISTS "tenant_select" ON orders;
  DROP POLICY IF EXISTS "tenant_insert" ON orders;
  DROP POLICY IF EXISTS "tenant_update" ON orders;
  DROP POLICY IF EXISTS "tenant_delete" ON orders;
  DROP POLICY IF EXISTS "tenant_select" ON conversations;
  DROP POLICY IF EXISTS "tenant_insert" ON conversations;
  DROP POLICY IF EXISTS "tenant_update" ON conversations;
  DROP POLICY IF EXISTS "tenant_delete" ON conversations;
  DROP POLICY IF EXISTS "tenant_select" ON messages;
  DROP POLICY IF EXISTS "tenant_insert" ON messages;
  DROP POLICY IF EXISTS "tenant_update" ON messages;
  DROP POLICY IF EXISTS "tenant_delete" ON messages;
  DROP POLICY IF EXISTS "tenant_select" ON payments;
  DROP POLICY IF EXISTS "tenant_insert" ON payments;
  DROP POLICY IF EXISTS "tenant_update" ON payments;
  DROP POLICY IF EXISTS "tenant_delete" ON payments;
  DROP POLICY IF EXISTS "tenant_select" ON automation_flows;
  DROP POLICY IF EXISTS "tenant_insert" ON automation_flows;
  DROP POLICY IF EXISTS "tenant_update" ON automation_flows;
  DROP POLICY IF EXISTS "tenant_delete" ON automation_flows;
  DROP POLICY IF EXISTS "tenant_select" ON flow_blocks;
  DROP POLICY IF EXISTS "tenant_insert" ON flow_blocks;
  DROP POLICY IF EXISTS "tenant_update" ON flow_blocks;
  DROP POLICY IF EXISTS "tenant_delete" ON flow_blocks;
  DROP POLICY IF EXISTS "tenant_select" ON flow_connections;
  DROP POLICY IF EXISTS "tenant_insert" ON flow_connections;
  DROP POLICY IF EXISTS "tenant_update" ON flow_connections;
  DROP POLICY IF EXISTS "tenant_delete" ON flow_connections;
  DROP POLICY IF EXISTS "tenant_select" ON restaurant_settings;
  DROP POLICY IF EXISTS "tenant_insert" ON restaurant_settings;
  DROP POLICY IF EXISTS "tenant_update" ON restaurant_settings;
  DROP POLICY IF EXISTS "tenant_delete" ON restaurant_settings;
  DROP POLICY IF EXISTS "tenant_select" ON order_items;
  DROP POLICY IF EXISTS "tenant_insert" ON order_items;
  DROP POLICY IF EXISTS "tenant_update" ON order_items;
  DROP POLICY IF EXISTS "tenant_delete" ON order_items;
  DROP POLICY IF EXISTS "tenant_select" ON delivery_tracking;
  DROP POLICY IF EXISTS "tenant_insert" ON delivery_tracking;
  DROP POLICY IF EXISTS "tenant_update" ON delivery_tracking;
  DROP POLICY IF EXISTS "tenant_delete" ON delivery_tracking;
  DROP POLICY IF EXISTS "peddi_team_select" ON peddi_team;
  DROP POLICY IF EXISTS "peddi_team_insert" ON peddi_team;
  DROP POLICY IF EXISTS "peddi_team_update" ON peddi_team;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Enable RLS on all tables (idempotent)
DO $$ BEGIN
  ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
  ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
  ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
  ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE automation_flows ENABLE ROW LEVEL SECURITY;
  ALTER TABLE flow_blocks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE flow_connections ENABLE ROW LEVEL SECURITY;
  ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
  ALTER TABLE peddi_team ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- RESTAURANTS
-- ============================================================
CREATE POLICY "restaurants_owner_select" ON restaurants
  FOR SELECT USING (id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
CREATE POLICY "restaurants_owner_insert" ON restaurants
  FOR INSERT WITH CHECK (public.get_user_role() = 'master');
CREATE POLICY "restaurants_owner_update" ON restaurants
  FOR UPDATE USING (id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
CREATE POLICY "restaurants_owner_delete" ON restaurants
  FOR DELETE USING (public.get_user_role() = 'master');

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    restaurant_id = public.get_user_restaurant_id()
    OR id = auth.uid()
    OR public.get_user_role() = 'master'
  );
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (
    restaurant_id = public.get_user_restaurant_id()
    OR public.get_user_role() = 'master'
  );
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (
    restaurant_id = public.get_user_restaurant_id()
    OR id = auth.uid()
    OR public.get_user_role() = 'master'
  );
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (
    restaurant_id = public.get_user_restaurant_id()
    OR public.get_user_role() = 'master'
  );

-- ============================================================
-- MULTI-TENANT POLICIES (admin tables + master access)
-- ============================================================
-- Generic tenant policies: owner sees own restaurant, master sees all
DO $$ BEGIN
  -- menu_categories
  CREATE POLICY "tenant_select" ON menu_categories FOR SELECT USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_insert" ON menu_categories FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_update" ON menu_categories FOR UPDATE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_delete" ON menu_categories FOR DELETE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

  -- menu_items
  CREATE POLICY "tenant_select" ON menu_items FOR SELECT USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_insert" ON menu_items FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_update" ON menu_items FOR UPDATE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_delete" ON menu_items FOR DELETE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

  -- customers
  CREATE POLICY "tenant_select" ON customers FOR SELECT USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_insert" ON customers FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_update" ON customers FOR UPDATE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_delete" ON customers FOR DELETE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

  -- orders
  CREATE POLICY "tenant_select" ON orders FOR SELECT USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master' OR delivery_person_id = auth.uid());
  CREATE POLICY "tenant_insert" ON orders FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_update" ON orders FOR UPDATE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master' OR delivery_person_id = auth.uid());
  CREATE POLICY "tenant_delete" ON orders FOR DELETE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

  -- conversations
  CREATE POLICY "tenant_select" ON conversations FOR SELECT USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_insert" ON conversations FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_update" ON conversations FOR UPDATE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_delete" ON conversations FOR DELETE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

  -- payments
  CREATE POLICY "tenant_select" ON payments FOR SELECT USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_insert" ON payments FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_update" ON payments FOR UPDATE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_delete" ON payments FOR DELETE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

  -- automation_flows
  CREATE POLICY "tenant_select" ON automation_flows FOR SELECT USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_insert" ON automation_flows FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_update" ON automation_flows FOR UPDATE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_delete" ON automation_flows FOR DELETE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

  -- restaurant_settings
  CREATE POLICY "tenant_select" ON restaurant_settings FOR SELECT USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_insert" ON restaurant_settings FOR INSERT WITH CHECK (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_update" ON restaurant_settings FOR UPDATE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');
  CREATE POLICY "tenant_delete" ON restaurant_settings FOR DELETE USING (restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master');

  -- order_items
  CREATE POLICY "tenant_select" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
  CREATE POLICY "tenant_insert" ON order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
  CREATE POLICY "tenant_update" ON order_items FOR UPDATE USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
  CREATE POLICY "tenant_delete" ON order_items FOR DELETE USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));

  -- delivery_tracking
  CREATE POLICY "tenant_select" ON delivery_tracking FOR SELECT USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master' OR o.delivery_person_id = auth.uid())));
  CREATE POLICY "tenant_insert" ON delivery_tracking FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
  CREATE POLICY "tenant_update" ON delivery_tracking FOR UPDATE USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master' OR o.delivery_person_id = auth.uid())));
  CREATE POLICY "tenant_delete" ON delivery_tracking FOR DELETE USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
END $$;

-- Messages: uses conversation subquery for tenant isolation
CREATE POLICY "tenant_select" ON messages
  FOR SELECT USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
CREATE POLICY "tenant_insert" ON messages
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
CREATE POLICY "tenant_update" ON messages
  FOR UPDATE USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
CREATE POLICY "tenant_delete" ON messages
  FOR DELETE USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));

-- Flow blocks/connections: use automation_flows subquery
CREATE POLICY "tenant_select" ON flow_blocks
  FOR SELECT USING (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
CREATE POLICY "tenant_insert" ON flow_blocks
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
CREATE POLICY "tenant_update" ON flow_blocks
  FOR UPDATE USING (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
CREATE POLICY "tenant_delete" ON flow_blocks
  FOR DELETE USING (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));

CREATE POLICY "tenant_select" ON flow_connections
  FOR SELECT USING (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
CREATE POLICY "tenant_insert" ON flow_connections
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
CREATE POLICY "tenant_update" ON flow_connections
  FOR UPDATE USING (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));
CREATE POLICY "tenant_delete" ON flow_connections
  FOR DELETE USING (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = public.get_user_restaurant_id() OR public.get_user_role() = 'master')));

-- ============================================================
-- PEDDI TEAM (Master panel - only master role can access)
-- ============================================================
CREATE POLICY "peddi_team_select" ON peddi_team
  FOR SELECT USING (public.get_user_role() = 'master');
CREATE POLICY "peddi_team_insert" ON peddi_team
  FOR INSERT WITH CHECK (public.get_user_role() = 'master');
CREATE POLICY "peddi_team_update" ON peddi_team
  FOR UPDATE USING (public.get_user_role() = 'master');
CREATE POLICY "peddi_team_delete" ON peddi_team
  FOR DELETE USING (public.get_user_role() = 'master');

-- platform_settings and flow_templates: only master
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_master_select" ON platform_settings
  FOR SELECT USING (public.get_user_role() = 'master');
CREATE POLICY "platform_master_insert" ON platform_settings
  FOR INSERT WITH CHECK (public.get_user_role() = 'master');
CREATE POLICY "platform_master_update" ON platform_settings
  FOR UPDATE USING (public.get_user_role() = 'master');

CREATE POLICY "flow_templates_select" ON flow_templates
  FOR SELECT USING (true);  -- Anyone can view templates
CREATE POLICY "flow_templates_insert" ON flow_templates
  FOR INSERT WITH CHECK (public.get_user_role() = 'master');
CREATE POLICY "flow_templates_update" ON flow_templates
  FOR UPDATE USING (public.get_user_role() = 'master');
CREATE POLICY "flow_templates_delete" ON flow_templates
  FOR DELETE USING (public.get_user_role() = 'master');

-- audit_logs: only master can read
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_master_select" ON audit_logs
  FOR SELECT USING (public.get_user_role() = 'master');
CREATE POLICY "audit_master_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);  -- Allow inserts from triggers/anyone

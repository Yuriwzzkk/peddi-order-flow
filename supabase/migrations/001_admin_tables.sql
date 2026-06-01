-- ============================================================
-- PEDDI - PAINEL ADMIN (Dono do Restaurante)
-- FASE 1: Tabelas, RLS e Triggers (IDEMPOTENT)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. TABELAS (IF NOT EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  cuisine_type TEXT[] DEFAULT '{}',
  service_type TEXT DEFAULT 'both' CHECK (service_type IN ('delivery', 'presencial', 'both')),
  business_hours JSONB DEFAULT '{"abre": "10:00", "fecha": "23:00"}',
  working_days TEXT[] DEFAULT '{"Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"}',
  bot_tone TEXT DEFAULT 'friendly' CHECK (bot_tone IN ('friendly', 'youthful', 'formal')),
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro')),
  trial_ends TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns if missing (for existing profiles table)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'restaurant_id') THEN
    ALTER TABLE profiles ADD COLUMN restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'type') THEN
    ALTER TABLE profiles ADD COLUMN type TEXT CHECK (type IN ('delivery', 'presencial'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'shift') THEN
    ALTER TABLE profiles ADD COLUMN shift TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'online') THEN
    ALTER TABLE profiles ADD COLUMN online BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'permissions') THEN
    ALTER TABLE profiles ADD COLUMN permissions JSONB DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
    ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🍽️',
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  upsell BOOLEAN DEFAULT false,
  upsell_product_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  upsell_message TEXT DEFAULT '',
  sales_count INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  total_orders INT DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  status TEXT DEFAULT 'novo' CHECK (status IN ('recorrente', 'novo', 'inativo')),
  favorites JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  attendant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  delivery_person_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'presencial')),
  type TEXT DEFAULT 'delivery' CHECK (type IN ('delivery', 'retirada', 'presencial')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'preparing', 'ready', 'delivery', 'completed', 'cancelled')),
  items JSONB DEFAULT '[]',
  total DECIMAL(10, 2) DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('pix', 'card', 'cash')),
  change_for DECIMAL(10, 2),
  observation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  channel TEXT DEFAULT 'whatsapp',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  mode TEXT DEFAULT 'bot' CHECK (mode IN ('bot', 'attendant')),
  unread_count INT DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('client', 'bot', 'attendant')),
  text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  method TEXT NOT NULL CHECK (method IN ('pix', 'card', 'cash')),
  amount DECIMAL(10, 2) NOT NULL,
  change_for DECIMAL(10, 2),
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '🤖',
  category TEXT DEFAULT 'custom',
  status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft')),
  active BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  stats_triggered INT DEFAULT 0,
  stats_responded INT DEFAULT 0,
  stats_ordered INT DEFAULT 0,
  stats_revenue DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flow_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES automation_flows(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  title TEXT DEFAULT '',
  icon TEXT DEFAULT '📦',
  message TEXT DEFAULT '',
  config JSONB DEFAULT '{}',
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flow_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES automation_flows(id) ON DELETE CASCADE,
  from_block_id UUID NOT NULL REFERENCES flow_blocks(id) ON DELETE CASCADE,
  to_block_id UUID NOT NULL REFERENCES flow_blocks(id) ON DELETE CASCADE,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restaurant_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
  business_hours JSONB,
  working_days TEXT[],
  payment_methods TEXT[] DEFAULT '{"pix", "card", "cash"}',
  notifications JSONB DEFAULT '{"push": true, "email": false, "whatsapp": true}',
  security JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. INDEXES (IF NOT EXISTS)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_restaurant_id ON profiles(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_restaurant_id ON conversations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_payments_restaurant_id ON payments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_automation_flows_restaurant_id ON automation_flows(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_flow_blocks_flow_id ON flow_blocks(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_connections_flow_id ON flow_connections(flow_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

CREATE OR REPLACE FUNCTION auth.get_user_restaurant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT restaurant_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Enable RLS on all tables
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
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop existing policies first (to make it idempotent)
DO $$ BEGIN
  DROP POLICY IF EXISTS "restaurants_owner_select" ON restaurants;
  DROP POLICY IF EXISTS "restaurants_owner_update" ON restaurants;
  DROP POLICY IF EXISTS "profiles_select" ON profiles;
  DROP POLICY IF EXISTS "profiles_insert" ON profiles;
  DROP POLICY IF EXISTS "profiles_update" ON profiles;
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
  DROP POLICY IF EXISTS "tenant_select" ON payments;
  DROP POLICY IF EXISTS "tenant_insert" ON payments;
  DROP POLICY IF EXISTS "tenant_update" ON payments;
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
END $$;

-- RESTAURANTS
CREATE POLICY "restaurants_owner_select" ON restaurants
  FOR SELECT USING (id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "restaurants_owner_update" ON restaurants
  FOR UPDATE USING (id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');

-- PROFILES
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (restaurant_id = auth.get_user_restaurant_id() OR id = auth.uid() OR auth.get_user_role() = 'master');
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');

-- Multi-tenant policies
CREATE POLICY "tenant_select" ON menu_categories FOR SELECT USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_insert" ON menu_categories FOR INSERT WITH CHECK (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_update" ON menu_categories FOR UPDATE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_delete" ON menu_categories FOR DELETE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');

CREATE POLICY "tenant_select" ON menu_items FOR SELECT USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_insert" ON menu_items FOR INSERT WITH CHECK (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_update" ON menu_items FOR UPDATE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_delete" ON menu_items FOR DELETE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');

CREATE POLICY "tenant_select" ON customers FOR SELECT USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_insert" ON customers FOR INSERT WITH CHECK (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_update" ON customers FOR UPDATE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_delete" ON customers FOR DELETE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');

CREATE POLICY "tenant_select" ON orders FOR SELECT USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_insert" ON orders FOR INSERT WITH CHECK (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_update" ON orders FOR UPDATE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_delete" ON orders FOR DELETE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');

CREATE POLICY "tenant_select" ON conversations FOR SELECT USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_insert" ON conversations FOR INSERT WITH CHECK (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_update" ON conversations FOR UPDATE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_delete" ON conversations FOR DELETE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');

CREATE POLICY "tenant_select" ON messages
  FOR SELECT USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master')));
CREATE POLICY "tenant_insert" ON messages
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master')));

CREATE POLICY "tenant_select" ON payments FOR SELECT USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_insert" ON payments FOR INSERT WITH CHECK (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_update" ON payments FOR UPDATE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');

CREATE POLICY "tenant_select" ON automation_flows FOR SELECT USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_insert" ON automation_flows FOR INSERT WITH CHECK (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_update" ON automation_flows FOR UPDATE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_delete" ON automation_flows FOR DELETE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');

CREATE POLICY "tenant_select" ON flow_blocks
  FOR SELECT USING (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master')));
CREATE POLICY "tenant_insert" ON flow_blocks
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master')));
CREATE POLICY "tenant_update" ON flow_blocks
  FOR UPDATE USING (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master')));
CREATE POLICY "tenant_delete" ON flow_blocks
  FOR DELETE USING (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master')));

CREATE POLICY "tenant_select" ON flow_connections
  FOR SELECT USING (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master')));
CREATE POLICY "tenant_insert" ON flow_connections
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master')));
CREATE POLICY "tenant_update" ON flow_connections
  FOR UPDATE USING (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master')));
CREATE POLICY "tenant_delete" ON flow_connections
  FOR DELETE USING (EXISTS (SELECT 1 FROM automation_flows f WHERE f.id = flow_id AND (f.restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master')));

CREATE POLICY "tenant_select" ON restaurant_settings FOR SELECT USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_insert" ON restaurant_settings FOR INSERT WITH CHECK (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');
CREATE POLICY "tenant_update" ON restaurant_settings FOR UPDATE USING (restaurant_id = auth.get_user_restaurant_id() OR auth.get_user_role() = 'master');

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'owner')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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

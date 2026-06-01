-- ============================================================
-- PEDDI - FASE 2: BACKEND COMPLETO (PARTE 1: FUNÇÕES + TRIGGERS)
-- ============================================================

-- 1. RECRIAR FUNÇÕES HELPER EM PUBLIC (Management API não cria em auth)
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT restaurant_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. CRIA FUNÇÕES TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, restaurant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'owner'),
    (NEW.raw_user_meta_data ->> 'restaurant_id')::UUID
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. ADD COLUMNS FALTANTES PARA TODOS OS PAINÉIS
DO $$ BEGIN
  -- Master panel: city column for restaurants
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'city') THEN
    ALTER TABLE restaurants ADD COLUMN city TEXT;
  END IF;

  -- Delivery panel: delivery_address on orders
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_address') THEN
    ALTER TABLE orders ADD COLUMN delivery_address TEXT;
  END IF;

  -- Delivery panel: customer_name and customer_phone on orders (for delivery visibility)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_phone') THEN
    ALTER TABLE orders ADD COLUMN customer_phone TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_name') THEN
    ALTER TABLE orders ADD COLUMN customer_name TEXT;
  END IF;

  -- profiles: updated_at for online status tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;

  -- Add payment_received and paid_at to orders for presencial panel
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paid_at') THEN
    ALTER TABLE orders ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_received') THEN
    ALTER TABLE orders ADD COLUMN payment_received BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 4. ADD COLUMNS PARA MASTER PANEL (restaurants)
DO $$ BEGIN
  -- restaurants: plan_expires_at for plan tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'plan_expires_at') THEN
    ALTER TABLE restaurants ADD COLUMN plan_expires_at TIMESTAMPTZ;
  END IF;

  -- restaurants: billing info for master panel
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'billing_email') THEN
    ALTER TABLE restaurants ADD COLUMN billing_email TEXT;
  END IF;
END $$;

-- 5. CRIAR NOVAS TABELAS

-- order_items: histórico de itens por pedido (para reports e analytics)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- delivery_tracking: rastreamento de entregas
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_person_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed')),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  address_snapshot TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- flow_templates: templates globais de fluxo (Master panel)
CREATE TABLE IF NOT EXISTS flow_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'atendimento' CHECK (category IN ('atendimento', 'vendas', 'recuperacao', 'upsell', 'marketing', 'custom')),
  icon TEXT DEFAULT '🤖',
  config JSONB DEFAULT '{}'::jsonb,
  blocks JSONB DEFAULT '[]'::jsonb,
  connections JSONB DEFAULT '[]'::jsonb,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- platform_settings: configurações globais do Master
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- audit_logs: trilha de auditoria para ações sensíveis
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PeddiTeam unificado (Master panel team management)
CREATE TABLE IF NOT EXISTS peddi_team (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('admin', 'support', 'dev', 'finance', 'comercial')),
  department TEXT DEFAULT 'support',
  permissions JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

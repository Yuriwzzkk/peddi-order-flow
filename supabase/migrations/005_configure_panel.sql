-- White label: coluna para configuracao visual por restaurante
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS white_label JSONB DEFAULT NULL;

-- Dominio personalizado
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS custom_domain TEXT;

-- Email do admin do painel (separado do email institucional)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS admin_email TEXT;

-- Se o painel ja foi configurado e enviado
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS painel_configurado BOOLEAN DEFAULT false;

-- Index para lookup por dominio
CREATE INDEX IF NOT EXISTS idx_restaurants_custom_domain ON restaurants (custom_domain) WHERE custom_domain IS NOT NULL;

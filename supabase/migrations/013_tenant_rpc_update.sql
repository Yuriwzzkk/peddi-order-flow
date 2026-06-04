-- Atualiza get_tenant_by_domain para retornar campos adicionais
DROP FUNCTION IF EXISTS public.get_tenant_by_domain(TEXT);

CREATE OR REPLACE FUNCTION public.get_tenant_by_domain(p_domain TEXT)
RETURNS TABLE(
  id UUID,
  name TEXT,
  slug TEXT,
  logo_url TEXT,
  white_label JSONB,
  whatsapp_number TEXT,
  primary_color TEXT,
  custom_domain TEXT,
  use_custom_domain BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    r.id,
    r.name,
    r.slug,
    r.white_label->>'logo_url' AS logo_url,
    r.white_label,
    r.whatsapp_number,
    r.white_label->>'primary_color' AS primary_color,
    r.custom_domain,
    COALESCE(r.use_custom_domain, false) AS use_custom_domain
  FROM public.restaurants r
  WHERE
    -- Match por domínio próprio
    (r.use_custom_domain = true AND r.domain_verified = true AND r.custom_domain = p_domain)
    -- Match por subdomínio (slug.foodwaker.app)
    OR (r.slug || '.foodwaker.app' = p_domain)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_by_domain TO anon, authenticated;

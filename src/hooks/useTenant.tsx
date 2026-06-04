// src/hooks/useTenant.tsx
// Detecta domínio/subdomínio e resolve o tenant (restaurante) correspondente
// Aplica white label automaticamente em todo o app
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  white_label: {
    brand_name?: string;
    logo_url?: string;
    primary_color?: string;
    background_color?: string;
    sidebar_color?: string;
  } | null;
  custom_domain: string | null;
  use_custom_domain: boolean;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  isCustomDomain: boolean;
  hostname: string;
  refresh: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | null>(null);

// Domínio principal — quando acessado, mostra o app padrão (não white label)
const PRIMARY_DOMAIN = "foodwaker.app";
const LOCALHOST_DOMAINS = ["localhost", "127.0.0.1"];

function isPrimaryDomain(host: string): boolean {
  if (LOCALHOST_DOMAINS.some(d => host.startsWith(d))) return true;
  if (host === PRIMARY_DOMAIN) return true;
  if (host === `www.${PRIMARY_DOMAIN}`) return true;
  return false;
}

function isSubdomainOf(host: string, base: string): boolean {
  return host.endsWith(`.${base}`);
}

function getSubdomain(host: string, base: string): string | null {
  if (!isSubdomainOf(host, base)) return null;
  const sub = host.slice(0, host.length - base.length - 1);
  // Ignora "www"
  if (sub === "www" || sub === "") return null;
  return sub;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [hostname, setHostname] = useState("");

  const resolveTenant = async (host: string) => {
    setHostname(host);
    setLoading(true);

    // Domínio primário → sem tenant
    if (isPrimaryDomain(host)) {
      setTenant(null);
      setLoading(false);
      return;
    }

    // Tenta cache em sessionStorage
    const cached = sessionStorage.getItem(`tenant:${host}`);
    if (cached) {
      try {
        const t = JSON.parse(cached) as Tenant;
        setTenant(t);
        setLoading(false);
        // Continua buscando em background para atualizar
      } catch { /* ignore */ }
    }

    // Chama RPC get_tenant_by_domain
    const { data, error } = await supabase.rpc("get_tenant_by_domain", {
      p_domain: host,
    });

    if (error) {
      console.error("Erro ao resolver tenant:", error);
      if (!cached) setTenant(null);
      setLoading(false);
      return;
    }

    if (data && (data as any).id) {
      const t = data as unknown as Tenant;
      setTenant(t);
      sessionStorage.setItem(`tenant:${host}`, JSON.stringify(t));
    } else {
      if (!cached) setTenant(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const host = window.location.hostname;
    resolveTenant(host);
  }, []);

  // Aplica CSS variables no root para white label
  useEffect(() => {
    const root = document.documentElement;
    if (tenant?.white_label) {
      const wl = tenant.white_label;
      if (wl.primary_color) root.style.setProperty("--tenant-primary", wl.primary_color);
      if (wl.background_color) root.style.setProperty("--tenant-bg", wl.background_color);
      if (wl.sidebar_color) root.style.setProperty("--tenant-sidebar", wl.sidebar_color);
    } else {
      root.style.removeProperty("--tenant-primary");
      root.style.removeProperty("--tenant-bg");
      root.style.removeProperty("--tenant-sidebar");
    }
  }, [tenant]);

  const isCustomDomain =
    !!tenant && !isSubdomainOf(hostname, PRIMARY_DOMAIN) && !isPrimaryDomain(hostname);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        isCustomDomain,
        hostname,
        refresh: () => resolveTenant(hostname),
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}

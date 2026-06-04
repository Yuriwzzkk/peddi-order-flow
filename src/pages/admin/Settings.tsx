import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Store, Smartphone, Clock, CreditCard, Save, Upload, LogOut, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { uploadLogo } from "@/services/upload";
import type { Restaurant } from "@/types";

const WEEKDAYS = [
  { key: "Seg", label: "Segunda" },
  { key: "Ter", label: "Terça" },
  { key: "Qua", label: "Quarta" },
  { key: "Qui", label: "Quinta" },
  { key: "Sex", label: "Sexta" },
  { key: "Sab", label: "Sábado" },
  { key: "Dom", label: "Domingo" },
];

const PAYMENT_OPTIONS = [
  { value: "card", label: "Cartão", icon: "💳" },
];


export default function Settings() {
  const { profile, signOut } = useAuth();
  const restaurantId = profile?.restaurant_id;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [zapiConfig, setZapiConfig] = useState<{ id?: string; api_token: string; instance_id: string; active: boolean }>({ api_token: "", instance_id: "", active: false });
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const [r, s, z] = await Promise.all([
        supabase.from("restaurants").select("*").eq("id", restaurantId).single(),
        supabase.from("restaurant_settings").select("*").eq("restaurant_id", restaurantId).maybeSingle(),
        supabase.from("zapi_config").select("*").eq("restaurant_id", restaurantId).maybeSingle(),
      ]);
      if (r.data) setRestaurant(r.data);
      if (s.data) setSettings(s.data);
      if (z.data) setZapiConfig({ id: z.data.id, api_token: z.data.api_token || "", instance_id: z.data.instance_id || "", active: z.data.active || false });
    } catch {
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveRestaurant = async (updates: Partial<Restaurant>) => {
    if (!restaurantId) return;
    setSaving("restaurant");
    try {
      const { error } = await supabase.from("restaurants").update(updates).eq("id", restaurantId);
      if (error) throw error;
      setRestaurant(prev => prev ? { ...prev, ...updates } : null);
      toast.success("Dados salvos!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(null);
    }
  };

  const saveSettings = async (updates: any) => {
    if (!restaurantId) return;
    setSaving("settings");
    try {
      const { error } = await supabase.from("restaurant_settings").upsert({
        restaurant_id: restaurantId,
        ...settings,
        ...updates,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSettings((prev: any) => ({ ...prev, ...updates }));
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(null);
    }
  };

  const saveZapi = async () => {
    if (!restaurantId) return;
    setSaving("zapi");
    try {
      const payload: any = {
        restaurant_id: restaurantId,
        api_token: zapiConfig.api_token,
        instance_id: zapiConfig.instance_id,
        active: zapiConfig.active,
      };
      if (zapiConfig.id) payload.id = zapiConfig.id;
      const { data, error } = await supabase.from("zapi_config").upsert(payload).select().single();
      if (error) throw error;
      setZapiConfig(prev => ({ ...prev, id: data.id }));
      toast.success("Configuração Z-API salva!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar Z-API");
    } finally {
      setSaving(null);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurantId) return;
    setLogoUploading(true);
    try {
      const url = await uploadLogo(restaurantId, file);
      await saveRestaurant({ logo_url: url });
      setLogoUploading(false);
    } catch {
      toast.error("Erro ao fazer upload");
      setLogoUploading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/admin/login";
  };

  if (loading) return <div className="text-muted-foreground">Carregando...</div>;

  if (!activeSection) {
    const sections = [
      { key: "restaurant", icon: Store, label: "Dados do restaurante", desc: restaurant?.name || "Sem nome", badge: null },
      { key: "hours", icon: Clock, label: "Horário de funcionamento", desc: `${restaurant?.business_hours?.abre || "??"} às ${restaurant?.business_hours?.fecha || "??"}`, badge: null },
      { key: "payments", icon: CreditCard, label: "Formas de pagamento", desc: (settings?.payment_methods || ["pix"]).join(", "), badge: null },
      { key: "whatsapp", icon: Smartphone, label: "WhatsApp", desc: restaurant?.whatsapp_number || "Não configurado", badge: restaurant?.whatsapp_number ? "Conectado" : null, badgeColor: restaurant?.whatsapp_number ? "text-status-ready" : "text-muted-foreground" },
    ];

    return (
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-xl font-bold text-foreground">Configurações</h1>
        <div className="bg-admin-card border border-admin-card-border rounded-xl overflow-hidden">
          {sections.map((s, i) => (
            <motion.button key={s.key} onClick={() => setActiveSection(s.key)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className={`w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors text-left ${i < sections.length - 1 ? "border-b border-admin-card-border" : ""}`}>
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <s.icon size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground truncate">{s.desc}</p>
                  {s.badge && <span className={`text-[10px] font-semibold ${s.badgeColor || "text-status-ready"}`}>● {s.badge}</span>}
                </div>
              </div>
              <ChevronRight size={18} className="text-muted-foreground shrink-0" />
            </motion.button>
          ))}
        </div>
        <Button variant="outline" onClick={handleSignOut} className="w-full gap-2 text-red-400 border-red-400/20 hover:bg-red-400/10">
          <LogOut size={16} /> Sair da conta
        </Button>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "restaurant":
        return (
          <div className="space-y-4">
            <button onClick={() => setActiveSection(null)} className="text-sm text-primary hover:underline">← Voltar</button>
            <h2 className="text-lg font-bold">Dados do restaurante</h2>
            <div className="bg-admin-card border border-admin-card-border rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl bg-secondary overflow-hidden flex items-center justify-center">
                  {restaurant?.logo_url ? (
                    <img src={restaurant.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store size={32} className="text-muted-foreground" />
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                    <Upload size={20} className="text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                  </label>
                </div>
                <div className="flex-1">
                  <Input value={restaurant?.name || ""} onChange={e => setRestaurant(prev => prev ? { ...prev, name: e.target.value } : null)} placeholder="Nome do restaurante" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input value={restaurant?.phone || ""} onChange={e => setRestaurant(prev => prev ? { ...prev, phone: e.target.value } : null)} placeholder="Telefone" />
                <Input value={restaurant?.email || ""} onChange={e => setRestaurant(prev => prev ? { ...prev, email: e.target.value } : null)} placeholder="Email" />
              </div>
              <Input value={restaurant?.city || ""} onChange={e => setRestaurant(prev => prev ? { ...prev, city: e.target.value } : null)} placeholder="Cidade" />
              <Input value={restaurant?.billing_email || ""} onChange={e => setRestaurant(prev => prev ? { ...prev, billing_email: e.target.value } : null)} placeholder="Email para faturamento" />
              <Button onClick={() => saveRestaurant({ name: restaurant!.name, phone: restaurant!.phone, email: restaurant!.email, city: restaurant!.city, billing_email: restaurant!.billing_email })} disabled={saving === "restaurant"} className="w-full gap-2">
                <Save size={16} /> {saving === "restaurant" ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        );

      case "hours": {
        const hours = restaurant?.business_hours || { abre: "10:00", fecha: "23:00" };
        const days = restaurant?.working_days || ["Seg","Ter","Qua","Qui","Sex","Sab","Dom"];
        return (
          <div className="space-y-4">
            <button onClick={() => setActiveSection(null)} className="text-sm text-primary hover:underline">← Voltar</button>
            <h2 className="text-lg font-bold">Horário de funcionamento</h2>
            <div className="bg-admin-card border border-admin-card-border rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground block mb-1">Abre</label>
                  <Input type="time" value={hours.abre} onChange={e => setRestaurant(prev => prev ? { ...prev, business_hours: { ...(prev.business_hours as any || {}), abre: e.target.value } } : null)} /></div>
                <div><label className="text-xs text-muted-foreground block mb-1">Fecha</label>
                  <Input type="time" value={hours.fecha} onChange={e => setRestaurant(prev => prev ? { ...prev, business_hours: { ...(prev.business_hours as any || {}), fecha: e.target.value } } : null)} /></div>
              </div>
              <div><label className="text-xs text-muted-foreground block mb-2">Dias de funcionamento</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map(w => (
                    <button key={w.key} onClick={() => {
                      const newDays = days.includes(w.key) ? days.filter(d => d !== w.key) : [...days, w.key];
                      setRestaurant(prev => prev ? { ...prev, working_days: newDays } : null);
                    }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${days.includes(w.key) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={() => saveRestaurant({ business_hours: hours as any, working_days: days })} disabled={saving === "restaurant"} className="w-full gap-2">
                <Save size={16} /> {saving === "restaurant" ? "Salvando..." : "Salvar horários"}
              </Button>
            </div>
          </div>
        );
      }

      case "payments": {
        const methods = settings?.payment_methods || ["pix"];
        return (
          <div className="space-y-4">
            <button onClick={() => setActiveSection(null)} className="text-sm text-primary hover:underline">← Voltar</button>
            <h2 className="text-lg font-bold">Formas de pagamento</h2>
            <div className="bg-admin-card border border-admin-card-border rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_OPTIONS.map(p => (
                  <button key={p.value} onClick={() => {
                    const newMethods = methods.includes(p.value) ? methods.filter((m: string) => m !== p.value) : [...methods, p.value];
                    setSettings((prev: any) => ({ ...prev, payment_methods: newMethods }));
                  }} className={`flex items-center gap-2 p-3 rounded-lg text-sm transition-colors ${methods.includes(p.value) ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-muted-foreground border border-transparent"}`}>
                    <span>{p.icon}</span> {p.label}
                  </button>
                ))}
              </div>
              <Button onClick={() => saveSettings({ payment_methods: methods })} disabled={saving === "settings"} className="w-full gap-2">
                <Save size={16} /> {saving === "settings" ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        );
      }

      case "whatsapp":
        return (
          <div className="space-y-4">
            <button onClick={() => setActiveSection(null)} className="text-sm text-primary hover:underline">← Voltar</button>
            <h2 className="text-lg font-bold">WhatsApp</h2>
            <div className="bg-admin-card border border-admin-card-border rounded-xl p-4 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Número do WhatsApp (com DDI, ex: 5511999999999)</label>
                <Input value={restaurant?.whatsapp_number || ""} onChange={e => setRestaurant(prev => prev ? { ...prev, whatsapp_number: e.target.value } : null)} placeholder="5511999999999" />
              </div>
              <Separator />
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Configuração Z-API</p>
                <p className="text-xs text-muted-foreground mb-3">Credenciais da instância Z-API que envia e recebe as mensagens do bot.</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Instance ID</label>
                    <Input value={zapiConfig.instance_id} onChange={e => setZapiConfig(p => ({ ...p, instance_id: e.target.value }))} placeholder="Ex: 3A0BC..." />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">API Token</label>
                    <div className="relative">
                      <Input type={showToken ? "text" : "password"} value={zapiConfig.api_token} onChange={e => setZapiConfig(p => ({ ...p, api_token: e.target.value }))} placeholder="Ex: AB12CD..." />
                      <button type="button" onClick={() => setShowToken(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div>
                      <p className="text-sm text-foreground">Integração ativa</p>
                      <p className="text-xs text-muted-foreground">Permite enviar e receber mensagens via Z-API</p>
                    </div>
                    <button
                      onClick={() => setZapiConfig(p => ({ ...p, active: !p.active }))}
                      className={`w-12 h-6 rounded-full transition-colors ${zapiConfig.active ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${zapiConfig.active ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => saveRestaurant({ whatsapp_number: restaurant?.whatsapp_number || null })} disabled={saving === "restaurant"} className="flex-1 gap-2">
                  <Save size={16} /> {saving === "restaurant" ? "Salvando..." : "Salvar número"}
                </Button>
                <Button onClick={saveZapi} disabled={saving === "zapi"} className="flex-1 gap-2">
                  <Save size={16} /> {saving === "zapi" ? "Salvando..." : "Salvar Z-API"}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="space-y-4 max-w-2xl pb-20">{renderSection()}</div>;
}

function ChevronRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Eye, EyeOff, Paintbrush, Globe, CheckCircle2, Clock, Loader2, Mail, Lock, ExternalLink, Image, MessageCircle, Bot, Copy, FileJson, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getPanelPending, configureRestaurantPanel, type PanelPendingRestaurant } from "@/services/master";
import { supabase } from "@/lib/supabase";
import LogoUploader from "@/components/LogoUploader";

type Tab = "pendentes" | "configurados";

const previewNavItems = [
  "📊 Dashboard", "📋 Pedidos", "💬 Conversas", "👥 Clientes", "🍽️ Cardápio", "⚙️ Config"
];

export default function MasterWhiteLabel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("pendentes");
  const [restaurants, setRestaurants] = useState<PanelPendingRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PanelPendingRestaurant | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Form fields
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPath, setLogoPath] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6C5CE7");
  const [bgColor, setBgColor] = useState("#0f0f0f");
  const [sidebarColor, setSidebarColor] = useState("#141414");
  const [domainType, setDomainType] = useState<"subdominio" | "proprio">("subdominio");
  const [customDomain, setCustomDomain] = useState("");
  // WhatsApp do cliente (Z-API)
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [zapiInstanceId, setZapiInstanceId] = useState("");
  const [zapiToken, setZapiToken] = useState("");
  const [zapiActive, setZapiActive] = useState(false);
  // N8n
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [n8nWebhookName, setN8nWebhookName] = useState("");
  const [n8nFlowJson, setN8nFlowJson] = useState("");
  // Mostrar/ocultar
  const [showN8nPrompt, setShowN8nPrompt] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPanelPending()
      .then(setRestaurants)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pendentes = restaurants.filter(r => !r.painel_configurado);
  const configurados = restaurants.filter(r => r.painel_configurado);

  const selectRestaurant = (r: PanelPendingRestaurant) => {
    setSelected(r);
    setAdminEmail(r.admin_email || r.email || "");
    setAdminPassword("");
    const wl = r.white_label as any;
    setBrandName(wl?.brand_name || r.name);
    setLogoUrl(wl?.logo_url || "");
    setLogoPath(wl?.logo_path || "");
    setPrimaryColor(wl?.primary_color || "#6C5CE7");
    setBgColor(wl?.background_color || "#0f0f0f");
    setSidebarColor(wl?.sidebar_color || "#141414");
    setDomainType(wl?.domain_type || "subdominio");
    setCustomDomain(wl?.custom_domain || "");
    setClientWhatsapp((r as any).whatsapp_number || "");
  };

  // Carrega Z-API e N8n do restaurante selecionado
  const loadRestaurantExtras = useCallback(async () => {
    if (!selected) return;
    try {
      // Z-API config
      const { data: zapi } = await supabase
        .from("zapi_config")
        .select("*")
        .eq("restaurant_id", selected.id)
        .maybeSingle();
      if (zapi) {
        setZapiInstanceId(zapi.instance_id || "");
        setZapiToken(zapi.api_token || "");
        setZapiActive(zapi.active || false);
      } else {
        setZapiInstanceId("");
        setZapiToken("");
        setZapiActive(false);
      }
      // N8n webhook principal
      const { data: n8n } = await supabase
        .from("n8n_webhooks")
        .select("*")
        .eq("restaurant_id", selected.id)
        .eq("active", true)
        .limit(1)
        .maybeSingle();
      if (n8n) {
        setN8nWebhookUrl(n8n.webhook_url || "");
        setN8nWebhookName(n8n.name || "");
      } else {
        setN8nWebhookUrl("");
        setN8nWebhookName("");
      }
    } catch (e) {
      console.error("Erro ao carregar extras:", e);
    }
  }, [selected]);

  useEffect(() => { loadRestaurantExtras(); }, [loadRestaurantExtras]);

  const handleConfigure = async () => {
    if (!selected) return;
    if (!adminEmail.trim() || !adminPassword.trim()) {
      toast.error("Preencha email e senha do admin");
      return;
    }
    if (adminPassword.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    setSaving(true);
    try {
      // 1) Configurar painel + criar admin (edge function)
      const result = await configureRestaurantPanel(selected.id, {
        admin_email: adminEmail.trim(),
        admin_password: adminPassword,
        brand_name: brandName,
        logo_url: logoUrl,
        logo_path: logoPath,
        primary_color: primaryColor,
        background_color: bgColor,
        sidebar_color: sidebarColor,
        domain_type: domainType,
        custom_domain: domainType === "proprio" ? customDomain : "",
      });

      // 2) Salvar WhatsApp number no restaurante
      if (clientWhatsapp) {
        await supabase.from("restaurants").update({ whatsapp_number: clientWhatsapp }).eq("id", selected.id);
      }

      // 3) Salvar Z-API config
      if (zapiInstanceId || zapiToken) {
        await supabase.from("zapi_config").upsert({
          restaurant_id: selected.id,
          instance_id: zapiInstanceId,
          api_token: zapiToken,
          active: zapiActive,
        }, { onConflict: "restaurant_id" });
      }

      // 4) Criar/Atualizar N8n webhook principal
      if (n8nWebhookUrl && n8nWebhookName) {
        const { data: existing } = await supabase
          .from("n8n_webhooks")
          .select("id")
          .eq("restaurant_id", selected.id)
          .eq("trigger_event", "order_created")
          .maybeSingle();
        if (existing) {
          await supabase.from("n8n_webhooks").update({
            name: n8nWebhookName,
            webhook_url: n8nWebhookUrl,
            active: true,
          }).eq("id", existing.id);
        } else {
          await supabase.from("n8n_webhooks").insert({
            restaurant_id: selected.id,
            name: n8nWebhookName,
            webhook_url: n8nWebhookUrl,
            trigger_event: "order_created",
            active: true,
          });
        }
      }

      // 5) Salvar flow JSON (opcional, em n8n_flows custom table)
      if (n8nFlowJson) {
        try {
          const parsed = JSON.parse(n8nFlowJson);
          await supabase.from("flow_templates").upsert({
            restaurant_id: selected.id,
            name: `Flow ${brandName || selected.name}`,
            blocks: parsed.blocks || [],
            connections: parsed.connections || [],
            is_template: false,
            is_active: true,
          }, { onConflict: "id" });
        } catch (e) {
          console.warn("Flow JSON inválido, ignorando:", e);
        }
      }

      toast.success("Painel configurado com sucesso!");
      if (result.email_sent) {
        toast.success(`Email enviado para ${adminEmail}`);
      } else {
        toast.warning("Não foi possível enviar o email. Configure a chave RESEND_API_KEY.");
      }

      // Atualizar lista
      setRestaurants(prev => prev.map(r =>
        r.id === selected.id ? { ...r, painel_configurado: true } : r
      ));
      setSelected(null);
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  const n8nPromptText = `Você é um especialista em n8n. Crie um workflow JSON completo (válido para importar via clipboard no n8n) que automatize o restaurante "${brandName || selected?.name || "Restaurante"}" no WhatsApp.

O workflow deve conter 4 nós principais:
1. **Webhook** (POST) - recebe notificações do Peddi quando há novo pedido
2. **IF** - verifica se é order_created, status_changed, ou delivery_assigned
3. **HTTP Request** - envia resposta para Z-API (https://api.z-api.io/instances/{instance_id}/token/{token}/send-text) com a mensagem personalizada
4. **Function** - formata a mensagem com emoji e variáveis (nome do cliente, status, link do pedido)

Formato do JSON esperado (cole a saída final na caixa "JSON do Fluxo"):
{
  "blocks": [
    { "id": "1", "type": "webhook", "name": "Receber Pedido" },
    { "id": "2", "type": "if", "name": "Tipo do Evento" },
    { "id": "3", "type": "http", "name": "Enviar WhatsApp" },
    { "id": "4", "type": "function", "name": "Formatar Mensagem" }
  ],
  "connections": [
    { "from": "1", "to": "2" },
    { "from": "2", "to": "3", "branch": "true" },
    { "from": "3", "to": "4" }
  ]
}

Gere APENAS o JSON, sem explicações.`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(n8nPromptText);
    toast.success("Prompt copiado! Cole em qualquer IA (ChatGPT, Claude, Gemini)");
  };

  const copyFlowJson = () => {
    if (!n8nFlowJson) {
      toast.error("Cole o JSON primeiro");
      return;
    }
    navigator.clipboard.writeText(n8nFlowJson);
    toast.success("JSON copiado! Cole no n8n com Ctrl+V");
  };

  const panelUrl = selected
    ? domainType === "proprio" && customDomain
      ? `https://${customDomain}`
      : `https://${selected.slug || selected.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.foodwaker.app`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/master/configuracoes")}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold">White Label</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure o painel personalizado de cada restaurante</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-admin-card border border-admin-card-border rounded-xl p-1 w-fit">
        {[
          { id: "pendentes" as Tab, label: `Pendentes (${pendentes.length})`, icon: Clock },
          { id: "configurados" as Tab, label: `Configurados (${configurados.length})`, icon: CheckCircle2 },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-8 text-sm">
          <Loader2 size={16} className="animate-spin" /> Carregando...
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Lista de restaurantes */}
          <div className={`${selected ? "w-72" : "max-w-2xl"} shrink-0`}>
            {tab === "pendentes" && pendentes.length === 0 && (
              <div className="bg-admin-card border border-admin-card-border rounded-xl p-8 text-center">
                <CheckCircle2 size={32} className="text-green-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Todos os restaurantes já foram configurados!</p>
                <p className="text-xs text-muted-foreground mt-1">Vá para a aba "Configurados" para ver a lista.</p>
              </div>
            )}
            {tab === "configurados" && configurados.length === 0 && (
              <div className="bg-admin-card border border-admin-card-border rounded-xl p-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhum restaurante configurado ainda.</p>
              </div>
            )}
            <div className="space-y-1">
              {(tab === "pendentes" ? pendentes : configurados).map(r => {
                const isSelected = selected?.id === r.id;
                return (
                  <motion.button key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => selectRestaurant(r)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-admin-card border border-admin-card-border hover:bg-secondary"
                    }`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${r.painel_configurado ? "bg-green-500" : "bg-yellow-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {r.painel_configurado ? r.admin_email || "configurado" : "⏳ Pendente"}
                      </p>
                    </div>
                    {r.painel_configurado && <CheckCircle2 size={14} className="text-green-500 shrink-0" />}
                    {!r.painel_configurado && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 shrink-0">Novo</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Formulário de configuração */}
          {selected && (
            <div className="flex-1 flex gap-6">
              <div className={`space-y-5 ${showPreview ? "flex-1 max-w-lg" : "flex-1"}`}>
                {/* Credenciais do admin */}
                <div className="bg-admin-card border border-admin-card-border rounded-xl p-5 space-y-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2"><Mail size={16} /> Acesso do admin</h2>
                  <p className="text-xs text-muted-foreground">Esses dados serão enviados por email para o dono do restaurante</p>
                  <div className="space-y-2">
                    <Label className="text-xs">Email do administrador</Label>
                    <Input value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                      placeholder="admin@restaurante.com" className="bg-[hsl(0,0%,7%)] border-admin-card-border text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Senha do administrador</Label>
                    <Input type="text" value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                      placeholder="mínimo 6 caracteres" className="bg-[hsl(0,0%,7%)] border-admin-card-border text-sm" />
                  </div>
                </div>

                {/* Identidade visual */}
                <div className="bg-admin-card border border-admin-card-border rounded-xl p-5 space-y-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2"><Paintbrush size={16} /> Identidade visual</h2>
                  <div className="space-y-2">
                    <Label className="text-xs">Nome da marca</Label>
                    <Input value={brandName} onChange={e => setBrandName(e.target.value)}
                      className="bg-[hsl(0,0%,7%)] border-admin-card-border text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Logo do restaurante</Label>
                    <LogoUploader
                      restaurantId={selected.id}
                      currentUrl={logoUrl}
                      currentPath={logoPath}
                      onUploaded={(r) => {
                        setLogoUrl(r.url);
                        setLogoPath(r.path);
                      }}
                      onRemoved={() => {
                        setLogoUrl("");
                        setLogoPath("");
                      }}
                    />
                    <details className="text-[10px] text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">Ou usar URL externa</summary>
                      <Input
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        placeholder="https://exemplo.com/logo.png"
                        className="bg-[hsl(0,0%,7%)] border-admin-card-border text-xs mt-1"
                      />
                    </details>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Primária", value: primaryColor, set: setPrimaryColor },
                      { label: "Fundo", value: bgColor, set: setBgColor },
                      { label: "Sidebar", value: sidebarColor, set: setSidebarColor },
                    ].map(c => (
                      <div key={c.label} className="space-y-2">
                        <Label className="text-xs">{c.label}</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={c.value} onChange={e => c.set(e.target.value)}
                            className="w-9 h-9 rounded-lg cursor-pointer border border-admin-card-border bg-transparent" />
                          <Input value={c.value} onChange={e => c.set(e.target.value)}
                            className="bg-[hsl(0,0%,7%)] border-admin-card-border text-xs w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Domínio */}
                <div className="bg-admin-card border border-admin-card-border rounded-xl p-5 space-y-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2"><Globe size={16} /> Domínio</h2>
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(0,0%,7%)] border border-admin-card-border cursor-pointer">
                    <input type="radio" name="dt" checked={domainType === "subdominio"}
                      onChange={() => setDomainType("subdominio")} className="accent-primary" />
                    <div>
                      <p className="text-sm font-medium">Subdomínio Foodwaker</p>
                      <p className="text-xs text-muted-foreground">{selected.slug}.foodwaker.app</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(0,0%,7%)] border border-admin-card-border cursor-pointer">
                    <input type="radio" name="dt" checked={domainType === "proprio"}
                      onChange={() => setDomainType("proprio")} className="accent-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Domínio próprio</p>
                      <p className="text-xs text-muted-foreground">aponte CNAME para foodwaker.app</p>
                    </div>
                  </label>
                  {domainType === "proprio" && (
                    <Input value={customDomain} onChange={e => setCustomDomain(e.target.value)}
                      placeholder="admin.meurestaurante.com"
                      className="bg-[hsl(0,0%,7%)] border-admin-card-border text-sm" />
                  )}
                </div>

                {/* WhatsApp + Z-API */}
                <div className="bg-admin-card border border-admin-card-border rounded-xl p-5 space-y-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2"><MessageCircle size={16} /> WhatsApp do cliente</h2>
                  <div>
                    <Label className="text-xs">Número do WhatsApp (com DDI, ex: 5511999999999)</Label>
                    <Input value={clientWhatsapp} onChange={e => setClientWhatsapp(e.target.value)}
                      placeholder="5511999999999" className="bg-[hsl(0,0%,7%)] border-admin-card-border text-sm mt-1" />
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground">Credenciais Z-API desta instância:</p>
                  <div>
                    <Label className="text-xs">Instance ID</Label>
                    <Input value={zapiInstanceId} onChange={e => setZapiInstanceId(e.target.value)}
                      placeholder="3A0BC..." className="bg-[hsl(0,0%,7%)] border-admin-card-border text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">API Token</Label>
                    <Input value={zapiToken} onChange={e => setZapiToken(e.target.value)}
                      placeholder="AB12CD..." className="bg-[hsl(0,0%,7%)] border-admin-card-border text-sm mt-1" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(0,0%,7%)] border border-admin-card-border">
                    <div>
                      <p className="text-sm text-foreground">Integração ativa</p>
                      <p className="text-xs text-muted-foreground">Permitir envio/recebimento de mensagens</p>
                    </div>
                    <button
                      onClick={() => setZapiActive(a => !a)}
                      className={`w-12 h-6 rounded-full transition-colors ${zapiActive ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${zapiActive ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                </div>

                {/* N8n principal */}
                <div className="bg-admin-card border border-admin-card-border rounded-xl p-5 space-y-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2"><Bot size={16} /> N8n principal do cliente</h2>
                  <div>
                    <Label className="text-xs">Nome do webhook</Label>
                    <Input value={n8nWebhookName} onChange={e => setN8nWebhookName(e.target.value)}
                      placeholder="Ex: CRM principal, Google Sheets, etc" className="bg-[hsl(0,0%,7%)] border-admin-card-border text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">URL do webhook n8n</Label>
                    <Input value={n8nWebhookUrl} onChange={e => setN8nWebhookUrl(e.target.value)}
                      placeholder="https://n8n.cliente.com/webhook/..." className="bg-[hsl(0,0%,7%)] border-admin-card-border text-sm mt-1" />
                  </div>

                  <Separator />

                  {/* Prompt para IA */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs flex items-center gap-1"><Sparkles size={12} /> Prompt para IA gerar o fluxo n8n</Label>
                      <button onClick={copyPrompt} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                        <Copy size={10} /> Copiar prompt
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">Cole este prompt no ChatGPT/Claude/Gemini para gerar o JSON do fluxo do cliente. Depois cole a resposta no campo abaixo.</p>
                    <pre className="text-[10px] bg-[hsl(0,0%,7%)] p-2 rounded border border-admin-card-border text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
                      {n8nPromptText}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs flex items-center gap-1"><FileJson size={12} /> JSON do Fluxo (gerado pela IA)</Label>
                      {n8nFlowJson && (
                        <button onClick={copyFlowJson} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                          <Copy size={10} /> Copiar p/ n8n
                        </button>
                      )}
                    </div>
                    <Textarea value={n8nFlowJson} onChange={e => setN8nFlowJson(e.target.value)}
                      placeholder='{ "blocks": [...], "connections": [...] }'
                      className="bg-[hsl(0,0%,7%)] border-admin-card-border text-xs font-mono min-h-[120px]" />
                  </div>
                </div>

                {/* Botão configurar */}
                <Button onClick={handleConfigure} disabled={saving}
                  className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl text-sm font-semibold">
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Configurando...</> : <><Mail size={16} /> Configurar painel e enviar email</>}
                </Button>
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="w-80 shrink-0">
                  <div className="sticky top-4">
                    <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Preview ao vivo</p>
                    <div className="rounded-xl overflow-hidden border border-admin-card-border"
                      style={{ background: bgColor }}>
                      <div className="flex h-[500px]">
                        <div className="w-48 flex flex-col shrink-0 border-r" style={{ background: sidebarColor, borderColor: `${primaryColor}40` }}>
                          <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: `${primaryColor}20` }}>
                            {logoUrl ? (
                              <img src={logoUrl} alt="logo" className="h-7" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: primaryColor }}>
                                {brandName.charAt(0)}
                              </div>
                            )}
                            <span className="text-sm font-bold text-white">{brandName}</span>
                          </div>
                          <nav className="flex-1 p-2 space-y-1">
                            {previewNavItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                                style={{
                                  background: i === 0 ? `${primaryColor}20` : "transparent",
                                  color: i === 0 ? primaryColor : "#888",
                                }}>
                                <span>{item}</span>
                              </div>
                            ))}
                          </nav>
                          <div className="p-4 border-t" style={{ borderColor: `${primaryColor}20` }}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{ background: `${primaryColor}30`, color: primaryColor }}>
                                {selected?.name?.charAt(0) || "R"}
                              </div>
                              <div>
                                <p className="text-xs font-medium" style={{ color: "#ccc" }}>{selected?.name}</p>
                                <p className="text-[10px]" style={{ color: "#666" }}>Admin</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 p-4">
                          <div className="h-3 w-32 rounded mb-4" style={{ background: `${primaryColor}30` }} />
                          <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="h-14 rounded-lg" style={{ background: `${primaryColor}10`, border: `1px solid ${primaryColor}20` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground justify-center">
                      <ExternalLink size={10} />
                      <span>{panelUrl}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

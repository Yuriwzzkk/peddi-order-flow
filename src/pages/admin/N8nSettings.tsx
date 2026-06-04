import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Play, ExternalLink, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { listN8nWebhooks, createN8nWebhook, toggleN8nWebhook, deleteN8nWebhook } from "@/services/n8n";
import { dispatchToWebhooks } from "@/services/n8n-dispatch";
import type { N8nWebhook } from "@/services/n8n";

const EVENT_OPTIONS = [
  { value: "order_created", label: "Novo Pedido", emoji: "🆕" },
  { value: "order_status_changed", label: "Status do Pedido", emoji: "🔄" },
  { value: "new_conversation", label: "Nova Conversa", emoji: "💬" },
  { value: "new_customer", label: "Novo Cliente", emoji: "👤" },
  { value: "payment_received", label: "Pagamento Recebido", emoji: "💰" },
  { value: "delivery_assigned", label: "Entrega Atribuída", emoji: "🛵" },
];

export default function N8nSettings() {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurant_id;
  const [webhooks, setWebhooks] = useState<N8nWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState("order_created");
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const data = await listN8nWebhooks(restaurantId);
      setWebhooks(data);
    } catch {
      toast.error("Erro ao carregar webhooks");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!restaurantId || !newUrl || !newName) return;
    try {
      const wh = await createN8nWebhook(restaurantId, newEvent, newUrl, {}, newName);
      setWebhooks(prev => [...prev, wh]);
      setNewUrl("");
      setNewName("");
      setShowForm(false);
      toast.success("Webhook criado!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar webhook");
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await toggleN8nWebhook(id, active);
      setWebhooks(prev => prev.map(w => w.id === id ? { ...w, active } : w));
      toast.success(active ? "Webhook ativado" : "Webhook pausado");
    } catch {
      toast.error("Erro ao alterar");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteN8nWebhook(id);
      setWebhooks(prev => prev.filter(w => w.id !== id));
      toast.success("Webhook removido");
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const handleTest = async (wh: N8nWebhook) => {
    try {
      await dispatchToWebhooks(wh.restaurant_id, wh.trigger_event, { test: true });
      toast.success("Teste enviado com sucesso!");
    } catch {
      toast.error("Falha no teste");
    }
  };

  if (loading) return <div className="text-muted-foreground">Carregando...</div>;

  const getEventLabel = (val: string) => EVENT_OPTIONS.find(e => e.value === val);

  return (
    <div className="space-y-6 max-w-2xl pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Integração n8n</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Conecte seu restaurante ao n8n para automações avançadas</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus size={16} /> {showForm ? "Cancelar" : "Novo webhook"}
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-admin-card border border-admin-card-border rounded-xl p-4 space-y-3">
          <Input placeholder="Nome do webhook (ex: Enviar para CRM)" value={newName} onChange={e => setNewName(e.target.value)} />
          <Select value={newEvent} onValueChange={setNewEvent}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EVENT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="URL do webhook n8n (https://n8n.seusite.com/webhook/...)" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
          <Button onClick={handleCreate} className="w-full">Criar webhook</Button>
        </motion.div>
      )}

      {webhooks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-1">Nenhum webhook configurado</p>
          <p className="text-sm">Adicione webhooks do n8n para automatizar processos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => {
            const ev = getEventLabel(wh.trigger_event);
            return (
              <motion.div key={wh.id} layout
                className="bg-admin-card border border-admin-card-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{ev?.emoji || "🔗"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{wh.name}</h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${wh.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {wh.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 break-all">{ev?.label}: {wh.webhook_url}</p>
                    {wh.last_triggered_at && (
                      <p className="text-xs text-muted-foreground mt-1">Último disparo: {new Date(wh.last_triggered_at).toLocaleString("pt-BR")}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => handleTest(wh)}
                    className="flex-1 h-9 text-xs border-admin-card-border rounded-lg">
                    <Play size={14} /> Testar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggle(wh.id, !wh.active)}
                    className="flex-1 h-9 text-xs border-admin-card-border rounded-lg">
                    <Power size={14} /> {wh.active ? "Pausar" : "Ativar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(wh.id)}
                    className="h-9 w-9 text-xs border-admin-card-border rounded-lg p-0 text-red-400">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="bg-admin-card border border-admin-card-border rounded-xl p-4 text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground mb-2">Eventos disponíveis</h3>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_OPTIONS.map(ev => (
            <div key={ev.value} className="flex items-center gap-2 text-xs">
              <span>{ev.emoji}</span>
              <span>{ev.label}</span>
              <code className="text-[10px] bg-secondary px-1 rounded ml-auto">{ev.value}</code>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs">O payload enviado inclui: event, restaurant_id, timestamp, e dados do evento</p>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Copy, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { listAttendants } from "@/services/team";
import { supabase } from "@/lib/supabase";
import type { Attendant } from "@/types";

const shifts = ["Manhã", "Tarde", "Noite", "Integral"];

export default function Team() {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurant_id;
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", type: "delivery" as "delivery" | "presencial", shift: "Noite" });

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    listAttendants(restaurantId)
      .then(setAttendants)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const handleCreate = async () => {
    if (!form.name || !form.email || !restaurantId) return;
    try {
      const defaultPassword = form.password || "123456";
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: form.email,
          password: defaultPassword,
          name: form.name,
          role: form.type,
          restaurant_id: restaurantId,
          type: form.type,
          shift: form.shift,
        },
      });
      if (error) throw error;
      const att: Attendant = {
        id: data.user_id || data.profile?.id || Date.now().toString(),
        restaurant_id: restaurantId,
        name: form.name,
        email: form.email,
        type: form.type,
        shift: form.shift,
        online: false,
        ordersToday: 0,
        revenueToday: 0,
        lastAccess: null,
      };
      setAttendants(prev => [att, ...prev]);
      setCreated({ name: form.name, email: form.email, password: defaultPassword });
      setForm({ name: "", email: "", password: "", type: "delivery", shift: "Noite" });
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar atendente. Verifique se o email já está cadastrado.");
    }
  };

  const copyAccess = () => {
    if (!created) return;
    navigator.clipboard.writeText(`Email: ${created.email}\nSenha: ${created.password}`);
    toast.success("Dados copiados!");
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Equipe</h1>
        <Button onClick={() => { setCreateOpen(true); setCreated(null); }} className="bg-primary hover:bg-primary-hover text-primary-foreground h-10 text-sm rounded-xl">
          <Plus size={16} className="mr-1" /> Novo atendente
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Carregando equipe...</div>
      ) : (
        <div className="space-y-3">
          {attendants.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-admin-card border border-admin-card-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">{a.name?.[0] || "?"}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{a.name}</span>
                      <span className={`w-2 h-2 rounded-full ${a.online ? "bg-status-ready" : "bg-muted-foreground"}`} />
                      <span className="text-[10px] text-muted-foreground">{a.online ? "Online" : "Offline"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{a.type === "delivery" ? "🛵 Delivery" : "🧍 Presencial"} · {a.shift}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Hoje: {a.ordersToday} pedidos</span>
                <span>R${a.revenueToday}</span>
                <span>Último acesso: {a.lastAccess || "nunca"}</span>
              </div>
            </motion.div>
          ))}
          {attendants.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">Nenhum atendente cadastrado</p>}
        </div>
      )}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom" className="bg-admin-nav border-admin-card-border rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground">{created ? "✅ Atendente criado!" : "Novo atendente"}</SheetTitle>
          </SheetHeader>

          <AnimatePresence mode="wait">
            {created ? (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 py-4">
                <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
                  <p className="text-muted-foreground">Acesso gerado:</p>
                  <p className="text-foreground">👤 {created.email}</p>
                  <p className="text-foreground">🔑 ••••••••</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyAccess} variant="outline" className="flex-1 h-11 border-admin-card-border text-foreground rounded-xl">
                    <Copy size={14} className="mr-2" /> Copiar dados
                  </Button>
                  <Button onClick={() => { toast.success("Enviado por WhatsApp!"); }} className="flex-1 h-11 bg-status-ready hover:bg-status-ready/90 text-white rounded-xl">
                    <Send size={14} className="mr-2" /> Enviar por WhatsApp
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Nome completo</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-admin-card-border h-11" placeholder="João Silva" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Email de acesso</Label>
                  <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="bg-secondary border-admin-card-border h-11" placeholder="joao@restaurante" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Senha</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="bg-secondary border-admin-card-border h-11" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Tipo</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["delivery", "presencial"] as const).map(t => (
                      <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.type === t ? "border-primary bg-primary/10 text-primary" : "border-admin-card-border text-muted-foreground"}`}>
                        {t === "delivery" ? "🛵 Delivery" : "🧍 Presencial"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Turno</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {shifts.map(s => (
                      <button key={s} onClick={() => setForm(p => ({ ...p, shift: s }))}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${form.shift === s ? "border-primary bg-primary/10 text-primary" : "border-admin-card-border text-muted-foreground"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full h-11 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl">
                  Criar atendente e gerar acesso
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>
    </div>
  );
}

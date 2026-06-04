import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Shield, GitBranch, BarChart3, Crown, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  permissions?: { department?: string };
}

const roleIcons: Record<string, typeof Crown> = { Master: Crown, Fluxos: GitBranch, Métricas: BarChart3, Suporte: Shield };
const roleColors: Record<string, string> = { Master: "text-primary", Fluxos: "text-green-400", Métricas: "text-blue-400", Suporte: "text-purple-400" };

export default function FoodWakerTeam() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSheet, setAddSheet] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Fluxos" });
  const roles = ["Master", "Fluxos", "Métricas", "Suporte"];

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/master/login", { replace: true }); return; }
    supabase.from("profiles").select("id, name, email, role, created_at, permissions").eq("role", "master").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        setMembers((data ?? []).map(m => ({ ...m, role: m.permissions?.department || m.role })));
      })
      .catch(() => toast.error("Erro ao carregar equipe"))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const handleAdd = async () => {
    if (!form.name || !form.email) { toast.error("Preencha nome e email"); return; }
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch("https://sqclpeyoimddjcrfcrmi.supabase.co/functions/v1/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${anonKey}` },
        body: JSON.stringify({ email: form.email, password: form.password || "123456", name: form.name, role: "master" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erro " + res.status);
      if (!result.user_id) throw new Error("Resposta inesperada");

      // Save department in profile permissions
      await supabase.from("profiles").update({ permissions: { department: form.role } }).eq("id", result.user_id);

      const newMember: TeamMember = { id: result.user_id, name: form.name, email: form.email, role: form.role, created_at: new Date().toISOString() };
      setMembers(prev => [newMember, ...prev]);
      setForm({ name: "", email: "", password: "", role: "Fluxos" });
      setAddSheet(false);
      toast.success("Membro adicionado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar.");
    }
  };

  const handleRemove = async (id: string, name: string) => {
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== id));
      toast.success(`${name} removido da equipe`);
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Equipe Foodwaker</h1>
        <Button size="sm" onClick={() => setAddSheet(true)} className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl">
          <Plus size={16} /> Adicionar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-8 text-sm">
          <Loader2 size={16} className="animate-spin" /> Carregando equipe...
        </div>
      ) : members.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Nenhum membro encontrado</div>
      ) : (
        <div className="space-y-3">
          {members.map((m, i) => {
            const Icon = roleIcons[m.role] || Shield;
            const color = roleColors[m.role] || "text-muted-foreground";
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-admin-card border border-admin-card-border rounded-xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center ${color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{m.name}</p>
                    <span className="text-[10px] text-muted-foreground">{m.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Cadastrado em {new Date(m.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-secondary ${color}`}>{m.role}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Trash2 size={14} className="text-muted-foreground hover:text-destructive" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,17%)]">
                      <DropdownMenuItem onClick={() => handleRemove(m.id, m.name)} className="text-destructive">🗑️ Confirmar exclusão</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Sheet open={addSheet} onOpenChange={setAddSheet}>
        <SheetContent side="bottom" className="bg-admin-nav border-admin-card-border rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-foreground">Adicionar membro</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="text-sm">Nome</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nome completo" className="bg-secondary border-admin-card-border rounded-xl h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Email</Label>
              <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="email@foodwaker.com" className="bg-secondary border-admin-card-border rounded-xl h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Senha</Label>
              <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••" className="bg-secondary border-admin-card-border rounded-xl h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Permissões</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map(r => (
                  <button key={r} onClick={() => setForm(p => ({ ...p, role: r }))}
                    className={`px-3 py-2.5 rounded-xl border text-xs bg-secondary hover:border-primary transition-colors ${form.role === r ? "border-primary text-primary" : "border-admin-card-border text-muted-foreground"}`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddSheet(false)} className="flex-1 h-11 border-admin-card-border rounded-xl">Cancelar</Button>
              <Button onClick={handleAdd} className="flex-1 h-11 bg-primary hover:bg-primary-hover rounded-xl">Adicionar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

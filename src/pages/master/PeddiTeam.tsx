import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Shield, GitBranch, BarChart3, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

const teamMembers = [
  { name: "Você", role: "Master", access: "Acesso total", icon: Crown, color: "text-primary" },
  { name: "Ana Lima", role: "Fluxos", access: "Acesso fluxos apenas", icon: GitBranch, color: "text-green-400" },
  { name: "Bruno Santos", role: "Métricas", access: "Acesso métricas apenas", icon: BarChart3, color: "text-blue-400" },
  { name: "Carla Mendes", role: "Suporte", access: "Acesso restaurantes apenas", icon: Shield, color: "text-purple-400" },
];

const permissions = ["Acesso total", "Apenas fluxos", "Apenas métricas", "Apenas restaurantes"];

export default function PeddiTeam() {
  const [addSheet, setAddSheet] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Equipe Peddi</h1>
        <Button size="sm" onClick={() => setAddSheet(true)} className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl">
          <Plus size={16} /> Adicionar
        </Button>
      </div>

      <div className="space-y-3">
        {teamMembers.map((m, i) => (
          <motion.div key={m.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-admin-card border border-admin-card-border rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center ${m.color}`}>
              <m.icon size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.access}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full bg-secondary ${m.color}`}>{m.role}</span>
          </motion.div>
        ))}
      </div>

      <Sheet open={addSheet} onOpenChange={setAddSheet}>
        <SheetContent side="bottom" className="bg-admin-nav border-admin-card-border rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-foreground">Adicionar membro</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="text-sm">Nome</Label>
              <Input placeholder="Nome completo" className="bg-secondary border-admin-card-border rounded-xl h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Email</Label>
              <Input placeholder="email@peddi.com" className="bg-secondary border-admin-card-border rounded-xl h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Permissões</Label>
              <div className="grid grid-cols-2 gap-2">
                {permissions.map(p => (
                  <button key={p} className="px-3 py-2.5 rounded-xl border border-admin-card-border text-xs bg-secondary hover:border-primary transition-colors">{p}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddSheet(false)} className="flex-1 h-11 border-admin-card-border rounded-xl">Cancelar</Button>
              <Button onClick={() => { setAddSheet(false); toast.success("Membro adicionado!"); }} className="flex-1 h-11 bg-primary hover:bg-primary-hover rounded-xl">Adicionar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Eye, Trash2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { listFlows, toggleFlow as toggleFlowApi, deleteFlow } from "@/services/automations";
import type { OwnerFlow } from "@/types";

export default function Automation() {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurant_id;
  const [flows, setFlows] = useState<OwnerFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadFlows = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const f = await listFlows(restaurantId);
      setFlows(f);
    } catch {
      toast.error("Erro ao carregar fluxos");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { loadFlows(); }, [loadFlows]);

  const handleToggle = async (id: string) => {
    const flow = flows.find(f => f.id === id);
    if (!flow) return;
    try {
      await toggleFlowApi(id, !flow.active);
      setFlows(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
      toast.success(flow.active ? "Fluxo pausado" : "Fluxo ativado");
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  const handleDelete = async (flowId: string) => {
    try {
      await deleteFlow(flowId);
      setFlows(prev => prev.filter(f => f.id !== flowId));
      setConfirmDelete(null);
      toast.success("Fluxo removido");
    } catch {
      toast.error("Erro ao remover");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4 max-w-3xl pb-20">
      <div>
        <h1 className="text-xl font-bold text-foreground">Automações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Fluxos de automação do seu restaurante</p>
      </div>

      {flows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-admin-card border border-admin-card-border rounded-xl">
          <p className="text-lg mb-2">Nenhum fluxo ainda</p>
          <p className="text-sm">Os fluxos são configurados pela equipe FoodWaker</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flows.map((flow, i) => (
            <motion.div key={flow.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`bg-admin-card border border-admin-card-border rounded-xl p-4 ${!flow.active ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{flow.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{flow.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{flow.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{flow.stat}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => handleToggle(flow.id)}
                  className={`flex-1 h-9 text-xs rounded-lg ${flow.active ? "border-yellow-500/30 text-yellow-500" : "border-green-500/30 text-green-500"}`}>
                  {flow.active ? <><Pause size={14} /> Pausar</> : <><Play size={14} /> Ativar</>}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(flow.id)}
                  className="h-9 px-3 text-xs rounded-lg text-red-400 border-red-400/30">
                  <Trash2 size={14} className="mr-1" /> Excluir
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de confirmação de exclusão (2 cliques) */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-xl p-6 max-w-sm w-full text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold mb-2">Excluir fluxo?</h2>
              <p className="text-sm text-muted-foreground mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1">Cancelar</Button>
                <Button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-500 hover:bg-red-600 text-white">Confirmar exclusão</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

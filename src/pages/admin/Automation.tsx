import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Pause, Play, Zap, Plus, Copy, Trash2, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import FlowDetailView from "@/components/admin/FlowDetailView";
import AICreateFlowModal from "@/components/admin/AICreateFlowModal";
import { useAuth } from "@/hooks/useAuth";
import { listFlows, toggleFlow as toggleFlowApi, createFlow, duplicateFlow } from "@/services/automations";
import { getFlowTemplates, getFlowBlocks, getFlowConnections } from "@/services/flow-engine";
import type { OwnerFlow, FlowTemplate } from "@/types";

export default function Automation() {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurant_id;
  const [flows, setFlows] = useState<OwnerFlow[]>([]);
  const [templates, setTemplates] = useState<FlowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailFlow, setDetailFlow] = useState<OwnerFlow | null>(null);
  const [showAICreate, setShowAICreate] = useState(false);

  const loadFlows = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const [f, t] = await Promise.all([
        listFlows(restaurantId),
        getFlowTemplates().catch(() => [] as FlowTemplate[]),
      ]);
      setFlows(f);
      setTemplates(t);
    } catch (e: any) {
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
      if (detailFlow?.id === id) setDetailFlow(prev => prev ? { ...prev, active: !prev.active } : null);
      toast.success(flow.active ? "Fluxo pausado" : "Fluxo ativado");
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  const handleDuplicate = async (flowId: string) => {
    if (!restaurantId) return;
    try {
      const newFlow = await duplicateFlow(flowId, restaurantId);
      setFlows(prev => [newFlow, ...prev]);
      toast.success("Fluxo duplicado!");
    } catch {
      toast.error("Erro ao duplicar");
    }
  };

  const handleDelete = async (flowId: string) => {
    try {
      setFlows(prev => prev.filter(f => f.id !== flowId));
      toast.success("Fluxo removido");
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const handleFlowCreated = async (flowData: { name: string; icon: string; steps: any[] }) => {
    if (!restaurantId) return;
    try {
      const newFlow = await createFlow(restaurantId, {
        name: flowData.name,
        icon: flowData.icon,
        description: flowData.steps.map(s => s.label).join(" → "),
        steps: flowData.steps,
        active: true,
      });
      setFlows(prev => [newFlow, ...prev]);
      toast.success("Fluxo criado com sucesso!");
    } catch {
      toast.error("Erro ao criar fluxo");
    }
  };

  const handleUpdateStep = async (flowId: string, stepIdx: number, newMessage: string) => {
    setFlows(prev => prev.map(f => {
      if (f.id !== flowId || !f.detail) return f;
      const updatedSteps = [...f.detail.steps];
      updatedSteps[stepIdx] = { ...updatedSteps[stepIdx], message: newMessage };
      return { ...f, detail: { ...f.detail, steps: updatedSteps } };
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  return (
    <>
      <div className="space-y-4 max-w-2xl pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Automações do seu restaurante</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie seus fluxos de chatbot e automação</p>
          </div>
        </div>

        {/* Templates disponíveis */}
        {templates.length > 0 && (
          <div className="bg-admin-card border border-admin-card-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Modelos prontos</h3>
            <div className="grid grid-cols-2 gap-2">
              {templates.map(t => (
                <button key={t.id} onClick={() => {
                  handleFlowCreated({
                    name: t.name,
                    icon: t.icon,
                    steps: (t.blocks as any[] || []).map(b => ({
                      icon: b.icon || "🤖",
                      label: b.title || b.block_type,
                      message: b.message,
                    })),
                  });
                }}
                  className="text-left p-3 rounded-lg bg-admin-card-hover hover:bg-admin-card-hover/60 border border-admin-card-border text-xs transition-colors">
                  <span className="text-lg block mb-1">{t.icon}</span>
                  <div className="font-medium text-foreground truncate">{t.name}</div>
                  <div className="text-muted-foreground truncate">{t.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {flows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Nenhum fluxo de automação ainda</p>
            <p className="text-sm">Crie seu primeiro fluxo ou use um modelo acima</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flows.map((flow, i) => (
              <motion.div key={flow.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`bg-admin-card border border-admin-card-border rounded-xl p-4 ${!flow.active ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{flow.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{flow.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{flow.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{flow.stat}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setDetailFlow(flow)}
                    className="flex-1 h-9 text-xs border-admin-card-border rounded-lg">
                    <Eye size={14} /> Detalhes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggle(flow.id)}
                    className="flex-1 h-9 text-xs border-admin-card-border rounded-lg">
                    {flow.active ? <><Pause size={14} /> Pausar</> : <><Play size={14} /> Ativar</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDuplicate(flow.id)}
                    className="h-9 w-9 text-xs border-admin-card-border rounded-lg p-0">
                    <Copy size={14} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(flow.id)}
                    className="h-9 w-9 text-xs border-admin-card-border rounded-lg p-0 text-red-400">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <motion.button
        onClick={() => setShowAICreate(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.3 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3.5 rounded-2xl text-sm shadow-lg"
      >
        <motion.span animate={{ opacity: [1, 0.6, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
          <Zap size={18} />
        </motion.span>
        Criar automação
        <Plus size={16} />
      </motion.button>

      <AnimatePresence>
        {detailFlow && (
          <FlowDetailView
            flow={detailFlow}
            onClose={() => setDetailFlow(null)}
            onToggle={handleToggle}
            onUpdateStep={handleUpdateStep}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAICreate && (
          <AICreateFlowModal
            onClose={() => setShowAICreate(false)}
            onFlowCreated={handleFlowCreated}
          />
        )}
      </AnimatePresence>
    </>
  );
}

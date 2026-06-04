import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Save, Play, Trash2, MoreHorizontal, Copy, Pause, ZoomIn, ZoomOut, Maximize2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import FlowBlockSidebar from "@/components/master/FlowBlockSidebar";
import FlowCanvas from "@/components/master/FlowCanvas";
import FlowConfigPanel from "@/components/master/FlowConfigPanel";
import FlowTestPanel from "@/components/master/FlowTestPanel";
import { type CanvasBlock } from "@/components/master/flowData";
import { listFlows, toggleFlow as toggleFlowApi, deleteFlow, duplicateFlow, updateFlowSteps, createFlow } from "@/services/automations";
import { getAllRestaurantsSummary } from "@/services/master";
import type { OwnerFlow } from "@/types";

export default function Flows() {
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [flows, setFlows] = useState<OwnerFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFlow, setEditingFlow] = useState<OwnerFlow | null>(null);
  const [newFlowModal, setNewFlowModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  // Canvas state
  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([]);
  const [canvasConnections, setCanvasConnections] = useState<{ from: string; to: string; label?: string }[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<CanvasBlock | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 40, y: 20 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const flowName = data.name || file.name.replace(/\.json$/, "");
        const importedBlocks: CanvasBlock[] = (data.nodes || data.blocks || []).map((n: any, i: number) => ({
          id: n.id || `imported-${i}`,
          icon: n.icon || n.type?.includes("trigger") ? "📩" : n.type?.includes("wait") ? "⏳" : "🤖",
          title: n.name || n.title || `Passo ${i + 1}`,
          categoryId: "action-messages",
          message: n.message || n.parameters?.message || n.json?.message || "",
          x: n.position?.[0] ?? n.x ?? 300,
          y: n.position?.[1] ?? n.y ?? i * 140 + 40,
        }));
        setEditingFlow({ id: `imported-${Date.now()}`, name: flowName, icon: "📂", description: "Importado de JSON", active: false, restaurant_id: restaurantId } as OwnerFlow);
        setCanvasBlocks(importedBlocks);
        const conns = data.connections || [];
        setCanvasConnections(conns.length > 0 ? conns : importedBlocks.slice(0, -1).map((_, i) => ({ from: importedBlocks[i].id, to: importedBlocks[i + 1].id })));
        setSelectedBlock(null);
        setTestOpen(false);
        toast.success(`📂 Fluxo "${flowName}" importado com ${importedBlocks.length} blocos!`);
      } catch (err: any) {
        toast.error("Arquivo JSON inválido: " + (err.message || "formato incorreto"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  useEffect(() => {
    getAllRestaurantsSummary().then(data => {
      const list = (data?.restaurants || []).map(r => ({ id: r.id, name: r.name }));
      setRestaurants(list);
      if (list.length > 0 && !restaurantId) setRestaurantId(list[0].id);
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    setEditingFlow(null);
    listFlows(restaurantId)
      .then(setFlows)
      .catch(() => toast.error("Erro ao carregar fluxos"))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const restaurant = restaurants.find(r => r.id === restaurantId);

  const handleToggle = async (id: string) => {
    const flow = flows.find(f => f.id === id);
    if (!flow) return;
    try {
      await toggleFlowApi(id, !flow.active);
      setFlows(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
      toast.success(flow.active ? "⏸️ Fluxo pausado" : "▶️ Fluxo ativado");
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFlow(id);
      setFlows(prev => prev.filter(f => f.id !== id));
      toast.success("🗑️ Fluxo excluído permanentemente!");
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!restaurantId) return;
    try {
      const newFlow = await duplicateFlow(id, restaurantId);
      setFlows(prev => [newFlow, ...prev]);
      toast.success("📋 Fluxo duplicado!");
    } catch {
      toast.error("Erro ao duplicar");
    }
  };

  const openCanvas = (flow: OwnerFlow) => {
    setEditingFlow(flow);
    const steps = flow.detail?.steps || [];
    setCanvasBlocks(steps.map((s, i) => ({
      id: `step-${i}`,
      icon: s.icon || "🤖",
      title: s.label || s.message?.slice(0, 30) || "Passo",
      categoryId: "action-messages",
      message: s.message || "",
      x: 300,
      y: i * 140 + 40,
    })));
    setCanvasConnections(
      steps.slice(0, -1).map((_, i) => ({ from: `step-${i}`, to: `step-${i + 1}` }))
    );
    setSelectedBlock(null);
    setTestOpen(false);
  };

  const addBlockToCanvas = (icon: string, title: string, categoryId: string) => {
    const newBlock: CanvasBlock = {
      id: `block-${Date.now()}`,
      icon, title, categoryId,
      message: `Configurar: ${title}`,
      x: 300, y: canvasBlocks.length * 140 + 40,
    };
    setCanvasBlocks(prev => [...prev, newBlock]);
  };

  const addBlockAt = (icon: string, title: string, categoryId: string, x: number, y: number) => {
    const newBlock: CanvasBlock = {
      id: `block-${Date.now()}`,
      icon, title, categoryId,
      message: `Configurar: ${title}`,
      x, y,
    };
    setCanvasBlocks(prev => [...prev, newBlock]);
  };

  const updateBlock = (block: CanvasBlock) => {
    setCanvasBlocks(prev => prev.map(b => b.id === block.id ? block : b));
  };

  const moveBlock = (id: string, x: number, y: number) => {
    setCanvasBlocks(prev => prev.map(b => b.id === id ? { ...b, x, y } : b));
  };

  const deleteBlock = (id: string) => {
    setCanvasBlocks(prev => prev.filter(b => b.id !== id));
    setCanvasConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    setSelectedBlock(null);
  };

  const handleSave = async () => {
    if (!editingFlow) return;
    const steps = canvasBlocks.map(b => ({
      icon: b.icon || "🤖",
      label: b.title,
      message: b.message,
    }));
    try {
      await updateFlowSteps(editingFlow.id, steps);
      toast.success("✅ Fluxo salvo no banco!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "desconhecido"));
    }
  };

  const handleCreateFlow = async () => {
    if (!restaurantId || !newFlowName.trim()) { toast.error("Digite um nome"); return; }
    try {
      const flow = await createFlow(restaurantId, {
        name: newFlowName.trim(),
        icon: "🤖",
        description: "",
        steps: [],
        active: false,
      });
      setFlows(prev => [flow, ...prev]);
      setNewFlowModal(false);
      setNewFlowName("");
      toast.success("✅ Fluxo criado!");
    } catch (err: any) {
      toast.error("Erro ao criar: " + (err.message || "desconhecido"));
    }
  };

  // ── CANVAS VIEW ──
  if (editingFlow) {
    return (
      <div className="fixed inset-0 bg-[hsl(0,0%,4%)] z-50 flex flex-col">
        <div className="h-12 bg-[hsl(0,0%,7%)] border-b border-[hsl(0,0%,17%)] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setEditingFlow(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} /> Fluxos
            </button>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-foreground">{restaurant?.name}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm font-semibold text-foreground">{editingFlow.icon} {editingFlow.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${editingFlow.active ? "bg-[hsl(142,71%,45%)]/15 text-green-400" : "bg-destructive/15 text-red-400"}`}>
              {editingFlow.active ? "🟢 Ativo" : "🔴 Inativo"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}
              className="h-8 border-[hsl(0,0%,17%)] text-xs rounded-lg"><Upload size={12} /> Importar</Button>
            <Button size="sm" variant="outline" onClick={handleSave}
              className="h-8 border-[hsl(0,0%,17%)] text-xs rounded-lg"><Save size={12} /> Salvar</Button>
            <Button size="sm" variant="outline" onClick={() => setTestOpen(!testOpen)}
              className="h-8 border-[hsl(0,0%,17%)] text-xs rounded-lg"><Play size={12} /> Testar</Button>
          </div>
        </div>
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-xl px-2 py-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}><ZoomOut size={14} /></Button>
          <span className="text-[11px] text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn size={14} /></Button>
          <div className="w-px h-4 bg-[hsl(0,0%,17%)] mx-1" />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setZoom(0.85); setPan({ x: 40, y: 20 }); }}><Maximize2 size={14} /></Button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <FlowBlockSidebar onAddBlock={addBlockToCanvas} />
          <FlowCanvas blocks={canvasBlocks} connections={canvasConnections}
            selectedId={selectedBlock?.id || null} highlightId={highlightId}
            onSelect={b => { setSelectedBlock(b); setTestOpen(false); }}
            zoom={zoom} pan={pan} onPanChange={setPan}
            onDropBlock={addBlockAt} onMoveBlock={moveBlock} onMoveEnd={() => {}}
            onConnect={(from, to) => {
              setCanvasConnections(prev => {
                if (prev.some(c => c.from === from && c.to === to)) return prev;
                return [...prev, { from, to }];
              });
            }}
            onDisconnect={(from, to) => {
              setCanvasConnections(prev => prev.filter(c => !(c.from === from && c.to === to)));
            }} />
          {selectedBlock && !testOpen && (
            <FlowConfigPanel block={selectedBlock} onClose={() => setSelectedBlock(null)}
              onUpdate={b => { updateBlock(b); setSelectedBlock(b); }} onDelete={deleteBlock} />
          )}
          {testOpen && (
            <FlowTestPanel blocks={canvasBlocks} connections={canvasConnections}
              onClose={() => { setTestOpen(false); setHighlightId(null); }} onHighlight={setHighlightId} />
          )}
        </div>
      </div>
    );
  }

  // ── FLOW LIST VIEW ──
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Fluxos de automação</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie os fluxos e n8n webhooks de cada restaurante</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={restaurantId} onChange={e => setRestaurantId(e.target.value)}
            className="bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-xl px-3 py-2 text-sm text-foreground">
            <option value="">Selecione um restaurante</option>
            {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} disabled={!restaurantId}
            className="h-10 border border-[hsl(0,0%,17%)] text-sm rounded-xl bg-transparent hover:bg-[hsl(0,0%,10%)]">
            <Upload size={14} /> Importar .json
          </Button>
          <Button onClick={() => setNewFlowModal(true)} disabled={!restaurantId}
            className="h-10 bg-primary hover:bg-primary/90 text-sm rounded-xl">
            <Plus size={14} /> Novo Fluxo
          </Button>
        </div>
      </div>

      <Dialog open={newFlowModal} onOpenChange={setNewFlowModal}>
        <DialogContent className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,17%)] rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Criar novo fluxo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Nome do fluxo</Label>
              <Input value={newFlowName} onChange={e => setNewFlowName(e.target.value)}
                placeholder="Ex: Boas-vindas" className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,17%)]" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setNewFlowModal(false)}
                className="flex-1 h-11 border-[hsl(0,0%,17%)] rounded-xl">Cancelar</Button>
              <Button onClick={handleCreateFlow}
                className="flex-1 h-11 bg-primary rounded-xl">Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-8 text-sm">
          <Loader2 size={16} className="animate-spin" /> Carregando fluxos...
        </div>
      ) : !restaurantId ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Selecione um restaurante para ver os fluxos</div>
      ) : flows.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p className="text-sm mb-2">Nenhum fluxo encontrado para este restaurante</p>
          <Button onClick={() => setNewFlowModal(true)} className="mt-3 bg-primary hover:bg-primary/90 rounded-xl text-xs h-9">
            <Plus size={14} /> Criar primeiro fluxo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {flows.map((flow, i) => (
            <motion.div key={flow.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-xl p-4 hover:border-[hsl(0,0%,22%)] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{flow.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{flow.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{flow.description}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><MoreHorizontal size={14} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,17%)]">
                    <DropdownMenuItem onClick={() => openCanvas(flow)}>✏️ Editar no canvas</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggle(flow.id)}>
                      {flow.active ? "⏸️ Pausar" : "▶️ Ativar"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(flow.id)}>📋 Duplicar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(flow.id)} className="text-destructive">🗑️ Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-3">
                <span>{flow.stat || (flow.active ? "🟢 Ativo" : "🔴 Inativo")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${flow.active ? "bg-[hsl(142,71%,45%)]/15 text-green-400" : "bg-destructive/15 text-red-400"}`}>
                  {flow.active ? "🟢 Ativo" : "🔴 Inativo"}
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => openCanvas(flow)}
                    className="h-8 text-xs border-[hsl(0,0%,17%)] rounded-lg">✏️ Canvas</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(flow.id)}
                    className="h-8 text-xs border-[hsl(0,0%,17%)] rounded-lg text-destructive hover:text-destructive">🗑️</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

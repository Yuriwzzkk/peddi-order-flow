import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Save, Play, LayoutTemplate, Trash2, MoreHorizontal, Copy, Pause, Upload, ChevronDown, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
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
import { defaultFlows, flowTemplates, flowCategoryOptions, type FlowData, type CanvasBlock } from "@/components/master/flowData";
import { getAllRestaurantsSummary } from "@/services/master";

export default function Flows() {
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [flows, setFlows] = useState<FlowData[]>(defaultFlows);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllRestaurantsSummary().then(data => {
      const list = (data?.restaurants || []).map(r => ({ id: r.id, name: r.name }));
      setRestaurants(list);
      if (list.length > 0) setRestaurantId(list[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);
  const [editingFlow, setEditingFlow] = useState<FlowData | null>(null);
  const [newFlowModal, setNewFlowModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowCategory, setNewFlowCategory] = useState("🤖 Atendimento");
  const [useTemplate, setUseTemplate] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("basic");

  // Canvas state
  const [selectedBlock, setSelectedBlock] = useState<CanvasBlock | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 40, y: 20 });

  const restaurant = restaurants.find(r => r.id === restaurantId);

  const statusBadge = (s: FlowData["status"]) => {
    const map = {
      active: { color: "bg-[hsl(142,71%,45%)]", label: "🟢 Ativo" },
      inactive: { color: "bg-destructive", label: "🔴 Inativo" },
      draft: { color: "bg-[hsl(38,92%,50%)]", label: "🟡 Rascunho" },
    };
    return map[s];
  };

  const createFlow = () => {
    const newFlow: FlowData = {
      id: `flow-${Date.now()}`,
      name: newFlowName || "Novo fluxo",
      icon: flowCategoryOptions.find(c => newFlowCategory.includes(c.label))?.icon || "⚙️",
      description: newFlowCategory,
      category: newFlowCategory,
      status: "draft",
      blockCount: 0,
      lastEdited: "agora",
      blocks: [],
      connections: [],
    };
    setFlows(prev => [...prev, newFlow]);
    setNewFlowModal(false);
    setNewFlowName("");
    toast.success("Fluxo criado!");
  };

  const toggleFlowStatus = (id: string) => {
    setFlows(prev => prev.map(f => f.id === id ? { ...f, status: f.status === "active" ? "inactive" : "active" } : f));
  };

  const duplicateFlow = (id: string) => {
    const flow = flows.find(f => f.id === id);
    if (!flow) return;
    setFlows(prev => [...prev, { ...flow, id: `flow-${Date.now()}`, name: flow.name + " (cópia)", status: "draft", lastEdited: "agora" }]);
    toast.success("Fluxo duplicado!");
  };

  const deleteFlow = (id: string) => {
    setFlows(prev => prev.filter(f => f.id !== id));
    toast.success("Fluxo excluído!");
  };

  const addBlockToCanvas = (icon: string, title: string, categoryId: string) => {
    if (!editingFlow) return;
    const newBlock: CanvasBlock = {
      id: `block-${Date.now()}`,
      icon, title, categoryId,
      message: `Configurar: ${title}`,
      x: 300, y: (editingFlow.blocks.length) * 140 + 40,
    };
    const updated = { ...editingFlow, blocks: [...editingFlow.blocks, newBlock], blockCount: editingFlow.blocks.length + 1 };
    setEditingFlow(updated);
    setFlows(prev => prev.map(f => f.id === updated.id ? updated : f));
  };

  const updateBlock = (block: CanvasBlock) => {
    if (!editingFlow) return;
    const updated = { ...editingFlow, blocks: editingFlow.blocks.map(b => b.id === block.id ? block : b) };
    setEditingFlow(updated);
    setFlows(prev => prev.map(f => f.id === updated.id ? updated : f));
  };

  const deleteBlock = (id: string) => {
    if (!editingFlow) return;
    const updated = {
      ...editingFlow,
      blocks: editingFlow.blocks.filter(b => b.id !== id),
      connections: editingFlow.connections.filter(c => c.from !== id && c.to !== id),
      blockCount: editingFlow.blocks.length - 1,
    };
    setEditingFlow(updated);
    setSelectedBlock(null);
    setFlows(prev => prev.map(f => f.id === updated.id ? updated : f));
  };

  // ── CANVAS VIEW ──
  if (editingFlow) {
    const badge = statusBadge(editingFlow.status);
    return (
      <div className="fixed inset-0 bg-[hsl(0,0%,4%)] z-50 flex flex-col">
        {/* Canvas header */}
        <div className="h-12 bg-[hsl(0,0%,7%)] border-b border-[hsl(0,0%,17%)] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => { setEditingFlow(null); setSelectedBlock(null); setTestOpen(false); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} /> Fluxos
            </button>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-foreground">{restaurant?.name}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm font-semibold text-foreground">{editingFlow.icon} {editingFlow.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${editingFlow.status === "active" ? "bg-[hsl(142,71%,45%)]/15 text-[hsl(142,71%,45%)]" : editingFlow.status === "inactive" ? "bg-destructive/15 text-destructive" : "bg-[hsl(38,92%,50%)]/15 text-[hsl(38,92%,50%)]"}`}>
              {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {editingFlow.status !== "active" && (
              <Button size="sm" onClick={() => { toggleFlowStatus(editingFlow.id); setEditingFlow({ ...editingFlow, status: "active" }); toast.success("Fluxo publicado!"); }}
                className="h-8 bg-[hsl(var(--primary))] text-xs rounded-lg">▶️ Publicar</Button>
            )}
            <Button size="sm" variant="outline" onClick={() => toast.success("Fluxo salvo!")}
              className="h-8 border-[hsl(0,0%,17%)] text-xs rounded-lg"><Save size={12} /> Salvar</Button>
            <Button size="sm" variant="outline" onClick={() => setTestOpen(!testOpen)}
              className="h-8 border-[hsl(0,0%,17%)] text-xs rounded-lg"><Play size={12} /> Testar</Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-xl px-2 py-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}><ZoomOut size={14} /></Button>
          <span className="text-[11px] text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn size={14} /></Button>
          <div className="w-px h-4 bg-[hsl(0,0%,17%)] mx-1" />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setZoom(0.85); setPan({ x: 40, y: 20 }); }}><Maximize2 size={14} /></Button>
        </div>

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden">
          <FlowBlockSidebar onAddBlock={addBlockToCanvas} />
          <FlowCanvas
            blocks={editingFlow.blocks}
            connections={editingFlow.connections}
            selectedId={selectedBlock?.id || null}
            highlightId={highlightId}
            onSelect={b => { setSelectedBlock(b); setTestOpen(false); }}
            zoom={zoom}
            pan={pan}
            onPanChange={setPan}
          />
          {selectedBlock && !testOpen && (
            <FlowConfigPanel
              block={selectedBlock}
              onClose={() => setSelectedBlock(null)}
              onUpdate={b => { updateBlock(b); setSelectedBlock(b); }}
              onDelete={deleteBlock}
            />
          )}
          {testOpen && (
            <FlowTestPanel
              blocks={editingFlow.blocks}
              connections={editingFlow.connections}
              onClose={() => { setTestOpen(false); setHighlightId(null); }}
              onHighlight={setHighlightId}
            />
          )}
        </div>
      </div>
    );
  }

  // ── FLOW GRID VIEW ──
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Fluxos de automação</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie os fluxos de cada restaurante</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={restaurantId} onChange={e => setRestaurantId(e.target.value)}
            className="bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-xl px-3 py-2 text-sm text-foreground">
            {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <Button onClick={() => setNewFlowModal(true)} className="h-10 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/0.9] rounded-xl text-sm">
            <Plus size={16} /> Novo fluxo
          </Button>
        </div>
      </div>

      {/* Flow cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {flows.map((flow, i) => {
          const badge = statusBadge(flow.status);
          return (
            <motion.div key={flow.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-xl p-4 hover:border-[hsl(0,0%,22%)] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{flow.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{flow.name}</h3>
                    <p className="text-xs text-muted-foreground">{flow.description}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><MoreHorizontal size={14} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,17%)]">
                    <DropdownMenuItem onClick={() => setEditingFlow(flow)}>✏️ Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateFlow(flow.id)}>📋 Duplicar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleFlowStatus(flow.id)}>
                      {flow.status === "active" ? "⏸️ Pausar" : "▶️ Ativar"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.success("Fluxo exportado!")}>📤 Exportar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteFlow(flow.id)} className="text-destructive">🗑️ Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                <span>{flow.blockCount} blocos</span>
                <span>·</span>
                <span>Editado: {flow.lastEdited}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${flow.status === "active" ? "bg-[hsl(142,71%,45%)]/15 text-[hsl(142,71%,45%)]" : flow.status === "inactive" ? "bg-destructive/15 text-destructive" : "bg-[hsl(38,92%,50%)]/15 text-[hsl(38,92%,50%)]"}`}>
                  {badge.label}
                </span>
                <Button size="sm" variant="outline" onClick={() => setEditingFlow(flow)}
                  className="h-8 text-xs border-[hsl(0,0%,17%)] rounded-lg">✏️ Editar</Button>
              </div>
            </motion.div>
          );
        })}

        {/* New flow card */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: flows.length * 0.04 }}
          onClick={() => setNewFlowModal(true)}
          className="bg-[hsl(0,0%,10%)] border border-dashed border-[hsl(0,0%,22%)] rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-[hsl(var(--primary))] transition-colors min-h-[160px]"
        >
          <Plus size={24} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Novo fluxo</span>
          <span className="text-xs text-muted-foreground">Criar do zero ou usar template</span>
        </motion.button>
      </div>

      {/* New flow modal */}
      <Dialog open={newFlowModal} onOpenChange={setNewFlowModal}>
        <DialogContent className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,17%)] rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Novo fluxo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Nome do fluxo</Label>
              <Input value={newFlowName} onChange={e => setNewFlowName(e.target.value)} placeholder="Ex: Recuperação de clientes" className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,17%)]" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Categoria</Label>
              <div className="flex flex-wrap gap-1.5">
                {flowCategoryOptions.map(c => (
                  <button key={c.label}
                    onClick={() => setNewFlowCategory(`${c.icon} ${c.label}`)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${newFlowCategory.includes(c.label)
                      ? "bg-[hsl(var(--primary))/0.1] border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                      : "bg-[hsl(0,0%,10%)] border-[hsl(0,0%,17%)] text-foreground"}`}
                  >{c.icon} {c.label}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Começar com</Label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="radio" checked={useTemplate} onChange={() => setUseTemplate(true)} className="accent-[hsl(var(--primary))]" /> Template pronto
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="radio" checked={!useTemplate} onChange={() => setUseTemplate(false)} className="accent-[hsl(var(--primary))]" /> Canvas vazio
                </label>
              </div>
            </div>
            <AnimatePresence>
              {useTemplate && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-2 gap-2">
                    {flowTemplates.map(t => (
                      <button key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`p-3 rounded-xl text-left border text-xs transition-colors ${selectedTemplate === t.id
                          ? "bg-[hsl(var(--primary))/0.1] border-[hsl(var(--primary))]"
                          : "bg-[hsl(0,0%,10%)] border-[hsl(0,0%,17%)] hover:border-[hsl(0,0%,22%)]"}`}
                      >
                        <span className="text-lg">{t.icon}</span>
                        <p className="text-foreground mt-1">{t.name}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setNewFlowModal(false)} className="flex-1 h-11 border-[hsl(0,0%,17%)] rounded-xl">Cancelar</Button>
              <Button onClick={createFlow} className="flex-1 h-11 bg-[hsl(var(--primary))] rounded-xl">Criar fluxo →</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

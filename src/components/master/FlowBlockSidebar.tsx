import { useState } from "react";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { blockCategories, type BlockDef } from "./flowData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  onAddBlock: (icon: string, title: string, categoryId: string) => void;
}

export default function FlowBlockSidebar({ onAddBlock }: Props) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [customModal, setCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customIcon, setCustomIcon] = useState("⚡");
  const [customCategory, setCustomCategory] = useState("client-triggers");

  const toggle = (id: string) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  const filtered = blockCategories.map(cat => ({
    ...cat,
    blocks: cat.blocks.filter(b =>
      b.title.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.blocks.length > 0);

  return (
    <div className="w-[280px] shrink-0 bg-[hsl(0,0%,7%)] border-r border-[hsl(0,0%,17%)] flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-[hsl(0,0%,17%)]">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar blocos..."
            className="w-full pl-8 pr-3 py-2 bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(var(--primary))]"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {filtered.map(cat => (
          <div key={cat.id}>
            <button
              onClick={() => toggle(cat.id)}
              className="w-full flex items-center justify-between px-2 py-2 text-[10px] font-bold tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{cat.label} ({cat.blocks.length})</span>
              <motion.div animate={{ rotate: collapsed[cat.id] ? -90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={12} />
              </motion.div>
            </button>
            <AnimatePresence>
              {!collapsed[cat.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-0.5"
                >
                  {cat.blocks.map(block => (
                    <button
                      key={`${cat.id}-${block.title}`}
                      onClick={() => !block.locked && onAddBlock(block.icon, block.title, cat.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border-l-[3px] text-xs transition-colors cursor-grab ${cat.color} ${
                        block.locked
                          ? "opacity-40 cursor-not-allowed bg-[hsl(0,0%,10%)]"
                          : "bg-[hsl(0,0%,10%)] hover:bg-[hsl(0,0%,14%)]"
                      }`}
                    >
                      <span className="text-sm">{block.icon}</span>
                      <span className="text-foreground truncate flex-1 text-left">{block.title}</span>
                      {block.locked && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted-foreground/20 text-muted-foreground whitespace-nowrap">Em breve</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Custom trigger button */}
      <div className="p-3 border-t border-[hsl(0,0%,17%)]">
        <Button onClick={() => setCustomModal(true)} className="w-full h-10 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/0.9] text-sm font-medium rounded-xl">
          <Sparkles size={14} /> Criar gatilho personalizado
        </Button>
      </div>

      {/* Custom trigger modal */}
      <Dialog open={customModal} onOpenChange={setCustomModal}>
        <DialogContent className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,17%)] rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Criar gatilho personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Nome</Label>
              <Input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Nome do gatilho" className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,17%)]" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Ícone (emoji)</Label>
              <Input value={customIcon} onChange={e => setCustomIcon(e.target.value)} className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,17%)] w-20 text-center text-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Categoria</Label>
              <select value={customCategory} onChange={e => setCustomCategory(e.target.value)}
                className="w-full bg-[hsl(0,0%,7%)] border border-[hsl(0,0%,17%)] rounded-lg px-3 py-2 text-sm text-foreground">
                {blockCategories.filter(c => !c.id.includes("integrations")).map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCustomModal(false)} className="flex-1 h-11 border-[hsl(0,0%,17%)] rounded-xl">Cancelar</Button>
              <Button onClick={() => { setCustomModal(false); toast.success("Gatilho personalizado criado!"); }} className="flex-1 h-11 bg-[hsl(var(--primary))] rounded-xl">Criar gatilho</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { type CanvasBlock, variables, blockCategories } from "./flowData";

interface Props {
  block: CanvasBlock;
  onClose: () => void;
  onUpdate: (block: CanvasBlock) => void;
  onDelete: (id: string) => void;
}

export default function FlowConfigPanel({ block, onClose, onUpdate, onDelete }: Props) {
  const cat = blockCategories.find(c => c.id === block.categoryId);
  const isCondition = block.categoryId === "conditions";
  const isInactive = block.title.includes("inativo");
  const isKeyword = block.title.includes("Palavra-chave");
  const isMenu = block.title.includes("cardápio") || block.title.includes("categoria") || block.title.includes("produto");
  const isUpsell = block.title.includes("upsell") || block.title.includes("cross-sell");

  return (
    <div className="w-[320px] shrink-0 bg-[hsl(0,0%,7%)] border-l border-[hsl(0,0%,17%)] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[hsl(0,0%,17%)]">
        <div className="flex items-center gap-2">
          <span className="text-lg">{block.icon}</span>
          <span className="text-sm font-semibold text-foreground truncate">{block.title}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-[hsl(0,0%,14%)] rounded-md transition-colors">
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* Message field (for most blocks) */}
        {!isCondition && (
          <div className="space-y-2">
            <Label className="text-sm">Mensagem</Label>
            <Textarea
              value={block.message}
              onChange={e => onUpdate({ ...block, message: e.target.value })}
              className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,17%)] min-h-[100px] text-sm"
            />
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Variáveis</Label>
              <div className="flex flex-wrap gap-1.5">
                {variables.map(v => (
                  <button key={v} onClick={() => onUpdate({ ...block, message: block.message + " " + v })}
                    className="text-[11px] px-2 py-1 rounded-md bg-[hsl(0,0%,10%)] text-[hsl(var(--primary))] border border-[hsl(0,0%,17%)] hover:bg-[hsl(var(--primary))/0.1] transition-colors">
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Delay */}
        {!isCondition && (
          <div className="space-y-2">
            <Label className="text-sm">Delay</Label>
            <div className="flex gap-1.5">
              {["Imediato", "30s", "1min", "5min"].map(d => (
                <button key={d} className="flex-1 px-2 py-2 rounded-lg bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] text-xs hover:border-[hsl(var(--primary))] transition-colors text-foreground">
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Condition config */}
        {isCondition && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">Condição</Label>
              <select className="w-full bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-lg px-3 py-2 text-sm text-foreground">
                <option>Horário está aberto?</option>
                <option>Cliente já pediu antes?</option>
                <option>Valor do pedido maior que?</option>
                <option>Cliente tem tag?</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Valor</Label>
              <input className="w-full bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-lg px-3 py-2 text-sm text-foreground" placeholder="Valor da condição" />
            </div>
            <div className="bg-[hsl(0,0%,10%)] rounded-lg p-3 space-y-2 border border-[hsl(0,0%,17%)]">
              <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-[hsl(142,71%,45%)]" /> Sim → próximo bloco</div>
              <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-destructive" /> Não → próximo bloco</div>
            </div>
          </div>
        )}

        {/* Inactive config */}
        {isInactive && (
          <div className="space-y-3">
            <Label className="text-sm">Dias de inatividade</Label>
            <Slider defaultValue={[7]} min={1} max={30} step={1} className="py-2" />
            <p className="text-xs text-muted-foreground">Valor: 7 dias</p>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Considerar inativo se:</Label>
              <label className="flex items-center gap-2 text-xs text-foreground"><input type="radio" name="inactive" defaultChecked className="accent-[hsl(var(--primary))]" /> Não fez pedido</label>
              <label className="flex items-center gap-2 text-xs text-foreground"><input type="radio" name="inactive" className="accent-[hsl(var(--primary))]" /> Não abriu conversa</label>
              <label className="flex items-center gap-2 text-xs text-foreground"><input type="radio" name="inactive" className="accent-[hsl(var(--primary))]" /> Não respondeu mensagem</label>
            </div>
          </div>
        )}

        {/* Keyword config */}
        {isKeyword && (
          <div className="space-y-3">
            <Label className="text-sm">Palavras (uma por linha)</Label>
            <Textarea defaultValue={"pix\naceita pix\nforma de pagamento"} className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,17%)] min-h-[80px] text-sm" />
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sensibilidade</Label>
              <div className="flex gap-1.5">
                {["Exata", "Contém", "Similar"].map((s, i) => (
                  <button key={s} className={`flex-1 px-2 py-2 rounded-lg text-xs border transition-colors ${i === 1 ? "bg-[hsl(var(--primary))/0.1] border-[hsl(var(--primary))] text-[hsl(var(--primary))]" : "bg-[hsl(0,0%,10%)] border-[hsl(0,0%,17%)] text-foreground"}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Menu config */}
        {isMenu && (
          <div className="space-y-3">
            <Label className="text-sm">O que enviar</Label>
            <label className="flex items-center gap-2 text-xs text-foreground"><input type="radio" name="menu" defaultChecked className="accent-[hsl(var(--primary))]" /> Cardápio completo</label>
            <label className="flex items-center gap-2 text-xs text-foreground"><input type="radio" name="menu" className="accent-[hsl(var(--primary))]" /> Categoria específica</label>
            <label className="flex items-center gap-2 text-xs text-foreground"><input type="radio" name="menu" className="accent-[hsl(var(--primary))]" /> Produto específico</label>
          </div>
        )}

        {/* Upsell config */}
        {isUpsell && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">Produto principal</Label>
              <select className="w-full bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-lg px-3 py-2 text-sm text-foreground">
                <option>Smash Burger</option><option>X-Bacon</option><option>Combo Peddi</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Produto sugerido</Label>
              <select className="w-full bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-lg px-3 py-2 text-sm text-foreground">
                <option>Batata Frita</option><option>Onion Rings</option><option>Milk Shake</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Desconto especial</Label>
              <Switch />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[hsl(0,0%,17%)]">
        <Button variant="ghost" onClick={() => onDelete(block.id)} className="w-full text-destructive text-xs h-9">
          <Trash2 size={14} /> Remover bloco
        </Button>
      </div>
    </div>
  );
}

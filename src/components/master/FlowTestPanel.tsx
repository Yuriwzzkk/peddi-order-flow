import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Square, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type CanvasBlock, type Connection } from "./flowData";

interface Props {
  blocks: CanvasBlock[];
  connections: Connection[];
  onClose: () => void;
  onHighlight: (blockId: string | null) => void;
}

const clients = [
  { name: "João Silva", desc: "cliente frequente · Último pedido: há 3 dias" },
  { name: "Maria Lima", desc: "nova cliente · Primeiro contato" },
  { name: "Carlos M.", desc: "cliente inativo · Sem pedido há 12 dias" },
];

interface LogEntry {
  time: string;
  status: "done" | "pending";
  title: string;
  detail: string;
}

export default function FlowTestPanel({ blocks, connections, onClose, onHighlight }: Props) {
  const [running, setRunning] = useState(false);
  const [client, setClient] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [step, setStep] = useState(-1);

  const now = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
  };

  const start = () => {
    setRunning(true);
    setLogs([]);
    setStep(0);
  };

  const stop = () => {
    setRunning(false);
    onHighlight(null);
  };

  const restart = () => {
    setLogs([]);
    setStep(0);
    setRunning(true);
  };

  useEffect(() => {
    if (!running || step < 0 || step >= blocks.length) {
      if (step >= blocks.length) {
        onHighlight(null);
      }
      return;
    }
    const block = blocks[step];
    onHighlight(block.id);
    const timer = setTimeout(() => {
      setLogs(prev => [...prev, {
        time: now(),
        status: "done",
        title: block.title,
        detail: block.message.substring(0, 60),
      }]);
      setStep(s => s + 1);
    }, 1200);
    return () => clearTimeout(timer);
  }, [running, step, blocks]);

  return (
    <div className="w-[400px] shrink-0 bg-[hsl(0,0%,7%)] border-l border-[hsl(0,0%,17%)] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-[hsl(0,0%,17%)]">
        <span className="text-sm font-semibold text-foreground">▶️ Testando fluxo</span>
        <button onClick={onClose} className="p-1 hover:bg-[hsl(0,0%,14%)] rounded-md"><X size={16} className="text-muted-foreground" /></button>
      </div>

      <div className="p-4 border-b border-[hsl(0,0%,17%)] space-y-3">
        <label className="text-xs text-muted-foreground">Simular como:</label>
        <select value={client} onChange={e => setClient(+e.target.value)}
          className="w-full bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-lg px-3 py-2 text-sm text-foreground">
          {clients.map((c, i) => <option key={i} value={i}>{c.name} — {c.desc}</option>)}
        </select>
        <div className="flex gap-2">
          {!running ? (
            <Button onClick={start} className="flex-1 h-10 bg-[hsl(var(--primary))] rounded-xl text-sm">▶️ Iniciar simulação</Button>
          ) : (
            <>
              <Button onClick={stop} variant="outline" className="flex-1 h-10 border-[hsl(0,0%,17%)] rounded-xl text-sm"><Square size={12} /> Parar</Button>
              <Button onClick={restart} variant="outline" className="flex-1 h-10 border-[hsl(0,0%,17%)] rounded-xl text-sm"><RotateCcw size={12} /> Reiniciar</Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
        <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Log</p>
        {logs.map((log, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-2.5 rounded-lg bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] text-xs">
            <span className="text-[hsl(142,71%,45%)] mt-0.5">✅</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{log.title}</span>
                <span className="text-[10px] text-muted-foreground">{log.time}</span>
              </div>
              <p className="text-muted-foreground mt-0.5 truncate">{log.detail}</p>
            </div>
          </motion.div>
        ))}
        {running && step < blocks.length && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(var(--primary))/0.05] border border-[hsl(var(--primary))/0.2] text-xs">
            <span className="animate-pulse">⏳</span>
            <span className="text-[hsl(var(--primary))]">Executando...</span>
          </div>
        )}
        {!running && logs.length > 0 && step >= blocks.length && (
          <p className="text-xs text-[hsl(142,71%,45%)] text-center pt-2">✅ Fluxo completo executado</p>
        )}
      </div>
    </div>
  );
}

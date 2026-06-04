import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Square, RotateCcw, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type CanvasBlock, type Connection } from "./flowData";

interface Props {
  blocks: CanvasBlock[];
  connections: Connection[];
  onClose: () => void;
  onHighlight: (blockId: string | null) => void;
}

interface ChatMessage {
  id: number;
  from: "bot" | "client";
  text: string;
  time: string;
}

const clientNames = ["João Silva", "Maria Lima", "Carlos M."];

export default function FlowTestPanel({ blocks, connections, onClose, onHighlight }: Props) {
  const [running, setRunning] = useState(false);
  const [client, setClient] = useState(0);
  const [step, setStep] = useState(-1);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const now = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const start = () => {
    setRunning(true);
    setMsgs([]);
    setStep(0);
  };

  const stop = () => {
    setRunning(false);
    setStep(-1);
    onHighlight(null);
  };

  const restart = () => {
    setMsgs([]);
    setStep(0);
    setRunning(true);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    setMsgs(prev => [...prev, { id: Date.now(), from: "client", text: input.trim(), time: now() }]);
    setInput("");
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  useEffect(() => {
    if (!running || step < 0 || step >= blocks.length) {
      if (step >= blocks.length) onHighlight(null);
      return;
    }
    const block = blocks[step];
    onHighlight(block.id);
    const timer = setTimeout(() => {
      setMsgs(prev => [...prev, { id: Date.now(), from: "bot", text: block.message || block.title, time: now() }]);
      setStep(s => s + 1);
    }, 800);
    return () => clearTimeout(timer);
  }, [running, step, blocks]);

  return (
    <div className="w-[380px] shrink-0 bg-[hsl(0,0%,7%)] border-l border-[hsl(0,0%,17%)] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[hsl(0,0%,17%)] bg-[hsl(0,0%,9%)]">
        <span className="text-sm font-semibold text-foreground">💬 Simulador WhatsApp</span>
        <button onClick={onClose} className="p-1 hover:bg-[hsl(0,0%,14%)] rounded-md"><X size={16} className="text-muted-foreground" /></button>
      </div>

      {/* Client selector + controls */}
      <div className="p-3 border-b border-[hsl(0,0%,17%)] space-y-2 bg-[hsl(0,0%,8%)]">
        <select value={client} onChange={e => setClient(+e.target.value)}
          className="w-full bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-lg px-3 py-2 text-sm text-foreground">
          {clientNames.map((n, i) => <option key={i} value={i}>{n}</option>)}
        </select>
        <div className="flex gap-2">
          {!running ? (
            <Button onClick={start} className="flex-1 h-9 bg-[hsl(142,71%,45%)] hover:bg-[hsl(142,71%,40%)] rounded-xl text-xs font-semibold"
              disabled={blocks.length === 0}>▶️ Iniciar</Button>
          ) : (
            <>
              <Button onClick={stop} variant="outline" className="flex-1 h-9 border-[hsl(0,0%,17%)] rounded-xl text-xs"><Square size={11} /> Parar</Button>
              <Button onClick={restart} variant="outline" className="flex-1 h-9 border-[hsl(0,0%,17%)] rounded-xl text-xs"><RotateCcw size={11} /> Reiniciar</Button>
            </>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin"
        style={{ background: "hsl(0,0%,5%)" }}>
        {msgs.length === 0 && !running && (
          <div className="text-center text-muted-foreground text-xs py-8">Clique em Iniciar para simular o fluxo</div>
        )}
        {msgs.map((msg) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.from === "bot" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
              msg.from === "bot"
                ? "bg-[hsl(0,0%,12%)] text-foreground rounded-tl-sm"
                : "bg-[hsl(142,71%,45%)]/20 text-foreground rounded-tr-sm"
            }`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">{msg.from === "bot" ? "🤖" : "👤"}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{msg.from === "bot" ? "Assistente" : clientNames[client]}</span>
                <span className="text-[9px] text-muted-foreground ml-auto">{msg.time}</span>
              </div>
              <p className="leading-relaxed">{msg.text}</p>
            </div>
          </motion.div>
        ))}
        {running && step < blocks.length && (
          <div className="flex justify-start">
            <div className="bg-[hsl(0,0%,12%)] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        {!running && msgs.length > 0 && step >= blocks.length && (
          <div className="text-center text-[hsl(142,71%,45%)] text-xs pt-2">✅ Fluxo concluído</div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-[hsl(0,0%,17%)] bg-[hsl(0,0%,8%)]">
        <div className="flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Digite uma resposta..."
            className="flex-1 bg-[hsl(0,0%,10%)] border-[hsl(0,0%,17%)] text-sm rounded-xl h-10"
          />
          <Button onClick={sendMessage} size="icon" className="h-10 w-10 bg-[hsl(142,71%,45%)] hover:bg-[hsl(142,71%,40%)] rounded-xl">
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

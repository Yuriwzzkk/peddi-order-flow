import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Pause, Play, Pencil, X, Send, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface FlowStep {
  icon: string;
  label: string;
  message?: string;
  editable?: boolean;
  branches?: { yes: string; no: string };
}

interface FlowDetail {
  steps: FlowStep[];
  stats: { triggered: number; responded?: number; ordered?: number; revenue?: string };
}

interface OwnerFlow {
  id: string;
  icon: string;
  name: string;
  description: string;
  active: boolean;
  stat: string;
  detail?: FlowDetail;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  actions?: { label: string; action: string }[];
}

const variables = ["{nome}", "{restaurante}", "{horario}", "{valor}"];

const suggestions = [
  { icon: "💬", label: "Melhorar mensagens" },
  { icon: "🎯", label: "Adicionar upsell" },
  { icon: "🔄", label: "Criar recuperação de clientes" },
  { icon: "⏰", label: "Configurar fora do horário" },
  { icon: "✨", label: "Tenho uma ideia..." },
];

function getAIResponse(msg: string): { content: string; actions?: { label: string; action: string }[] } {
  const lower = msg.toLowerCase();

  if (lower.includes("boas-vindas") || lower.includes("mensagem") || lower.includes("melhorar")) {
    return {
      content: `Que tal essa versão? 🎉\n\n*"Eeee, chegou o melhor do bairro! 🍔🔥 Bem-vindo ao {restaurante}, {nome}! Bora pedir?"*\n\nFicou mais animada né? Posso fazer outras versões também se quiser!`,
      actions: [
        { label: "✅ Aplicar esta", action: "apply_welcome" },
        { label: "🔄 Outra versão", action: "another_version" },
      ],
    };
  }

  if (lower.includes("upsell") || lower.includes("oferecer") || lower.includes("sugerir") || lower.includes("batata")) {
    return {
      content: `Ótima ideia! 🎯 Posso adicionar um bloco de upsell depois que o cliente escolher qualquer hamburguer.\n\nA mensagem seria:\n*"Que tal uma 🍟 Batata Frita por só +R$12,90? Combina demais!"*\n\nPosso adicionar isso ao seu fluxo agora?`,
      actions: [
        { label: "✅ Sim, adicionar", action: "add_upsell" },
        { label: "✏️ Editar mensagem", action: "edit_upsell" },
        { label: "❌ Não", action: "dismiss" },
      ],
    };
  }

  if (lower.includes("inativo") || lower.includes("sumiu") || lower.includes("falta") || lower.includes("recupera")) {
    return {
      content: `Perfeito! Isso se chama recuperação de clientes e funciona muito bem! 📈\n\nVou criar um fluxo assim:\n\n⏰ Gatilho: 7 dias sem pedido\n     ↓\n💬 Mensagem: *"Sentimos sua falta {nome}! 😢 Que tal voltar com 15% OFF?"*\n     ↓\n🔀 Respondeu?\n  ✅ Sim → Cardápio\n  ❌ Não → Encerrar\n\nCriar este fluxo?`,
      actions: [
        { label: "✅ Criar fluxo", action: "create_recovery" },
        { label: "✏️ Personalizar", action: "customize_recovery" },
      ],
    };
  }

  if (lower.includes("horário") || lower.includes("fechado") || lower.includes("fora do")) {
    return {
      content: `Boa! Posso configurar uma mensagem automática para quando o restaurante estiver fechado. 🌙\n\nSugestão:\n*"Ops, estamos fechados agora! 😴 Nosso horário é das {horario}. Mas pode fazer seu pedido que entregamos assim que abrirmos! 🚀"*\n\nQuer usar essa mensagem?`,
      actions: [
        { label: "✅ Aplicar", action: "apply_closed" },
        { label: "✏️ Editar", action: "edit_closed" },
      ],
    };
  }

  if (lower.includes("gatilho") || lower.includes("mudar quando") || lower.includes("lógica")) {
    return {
      content: `Entendo! 😊 A lógica dos gatilhos é gerenciada pela equipe técnica da FoodWaker para garantir que tudo funcione certinho.\n\nMas posso te ajudar a personalizar as mensagens ou criar fluxos novos!\n\nOu se precisar de algo específico nos gatilhos, é só falar que a gente configura pra você. 🙌`,
      actions: [{ label: "💬 Falar com a Peddi", action: "contact_peddi" }],
    };
  }

  return {
    content: `Claro, posso te ajudar! 😊 Aqui estão algumas coisas que posso fazer:\n\n💬 Melhorar as mensagens do seu bot\n🎯 Adicionar ofertas de upsell\n🔄 Criar fluxo de recuperação de clientes\n⏰ Configurar resposta fora do horário\n\nO que você gostaria?`,
  };
}

interface Props {
  flow: OwnerFlow;
  onClose: () => void;
  onToggle: (id: string) => void;
  onUpdateStep: (flowId: string, stepIdx: number, newMessage: string) => void;
}

export default function FlowDetailView({ flow, onClose, onToggle, onUpdateStep }: Props) {
  const [steps, setSteps] = useState(flow.detail?.steps || []);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editMsg, setEditMsg] = useState("");
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content: "Olá! Sou o assistente da FoodWaker. 👋\n\nPosso te ajudar a melhorar este fluxo ou criar novos.\n\nO que você precisa?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    const delay = 1200 + Math.random() * 800;
    setTimeout(() => {
      setTyping(false);
      const resp = getAIResponse(text);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: resp.content, actions: resp.actions };
      setMessages(prev => [...prev, aiMsg]);
    }, delay);
  };

  const handleAction = (action: string) => {
    if (action === "apply_welcome") {
      const newMsg = "Eeee, chegou o melhor do bairro! 🍔🔥 Bem-vindo ao {restaurante}, {nome}! Bora pedir?";
      const idx = steps.findIndex(s => s.label.toLowerCase().includes("boas-vindas"));
      if (idx >= 0) {
        const updated = [...steps];
        updated[idx] = { ...updated[idx], message: newMsg };
        setSteps(updated);
        onUpdateStep(flow.id, idx, newMsg);
        setHighlightIdx(idx);
        setTimeout(() => setHighlightIdx(null), 1500);
      }
      toast.success("Mensagem atualizada!");
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Pronto! ✅ Mensagem de boas-vindas atualizada no fluxo. Ficou top! 🔥" }]);
    } else if (action === "add_upsell") {
      const newStep: FlowStep = { icon: "🎯", label: "Upsell automático", message: "Que tal uma 🍟 Batata Frita por só +R$12,90? Combina demais!", editable: true };
      setSteps(prev => [...prev, newStep]);
      setHighlightIdx(steps.length);
      setTimeout(() => setHighlightIdx(null), 1500);
      toast.success("Bloco de upsell adicionado!");
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Bloco de upsell adicionado ao fluxo! 🎯 Ele vai aparecer após a confirmação do pedido." }]);
    } else if (action === "create_recovery") {
      toast.success("Fluxo de recuperação criado!");
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Fluxo de recuperação criado com sucesso! 🎉 Ele vai aparecer na sua lista de automações com o badge 🆕 Novo." }]);
    } else if (action === "contact_peddi") {
      toast.success("Solicitação enviada à equipe FoodWaker!");
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Enviei sua solicitação para a equipe técnica da FoodWaker! Eles vão entrar em contato em breve. 🙌" }]);
    } else if (action === "another_version") {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(), role: "assistant",
          content: `Aqui vai outra opção! 😄\n\n*"Faaala, {nome}! 🤙 Tá com fome? Você tá no lugar certo! Confere nosso cardápio 👇"*\n\nQuer aplicar essa?`,
          actions: [{ label: "✅ Aplicar esta", action: "apply_welcome_v2" }, { label: "🔄 Mais uma", action: "another_version" }],
        }]);
      }, 1500);
    } else {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Ok! Se precisar de mais alguma coisa, é só falar. 😊" }]);
    }
  };

  const openEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditMsg(steps[idx].message || "");
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const updated = [...steps];
    updated[editingIdx] = { ...updated[editingIdx], message: editMsg };
    setSteps(updated);
    onUpdateStep(flow.id, editingIdx, editMsg);
    setEditingIdx(null);
    toast.success("Mensagem atualizada!");
  };

  const previewMsg = editMsg.replace("{nome}", "João").replace("{restaurante}", "Burger House").replace("{horario}", "11h-23h").replace("{valor}", "R$45,90");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[hsl(0,0%,5%)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-admin-card-border bg-[hsl(0,0%,7%)] shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm text-muted-foreground">Automações</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-semibold text-foreground">{flow.icon} {flow.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${flow.active ? "bg-[hsl(142,71%,45%)]/20 text-[hsl(142,71%,45%)]" : "bg-destructive/20 text-destructive"}`}>
            {flow.active ? "🟢 Ativo" : "🔴 Inativo"}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={() => onToggle(flow.id)}
          className="h-8 text-xs border-admin-card-border rounded-lg">
          {flow.active ? <><Pause size={12} /> Pausar</> : <><Play size={12} /> Ativar</>}
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 md:w-[70%] overflow-y-auto p-6"
          style={{ background: "#0D0D0D", backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
          <div className="max-w-md mx-auto space-y-0">
            {steps.map((step, idx) => (
              <div key={idx}>
                {idx > 0 && (
                  <div className="flex justify-center py-1">
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-[hsl(var(--primary))]/40" />
                      <span className="text-[hsl(var(--primary))] text-xs">▼</span>
                      <div className="w-0.5 h-4 bg-[hsl(var(--primary))]/40" />
                    </div>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1, y: 0,
                    boxShadow: highlightIdx === idx ? "0 0 20px rgba(255,107,44,0.4)" : "0 4px 24px rgba(0,0,0,0.3)",
                    borderColor: highlightIdx === idx ? "hsl(var(--primary))" : "hsl(0,0%,17%)",
                  }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className="bg-[hsl(0,0%,10%)] border rounded-xl p-4 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{step.icon}</span>
                      <span className="text-sm font-semibold text-foreground">{step.label}</span>
                    </div>
                    {step.editable ? (
                      <button onClick={() => openEdit(idx)} className="flex items-center gap-1 text-xs text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors">
                        <Pencil size={12} /> Editar mensagem
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock size={10} /> Gerenciado pela FoodWaker
                      </span>
                    )}
                  </div>
                  {step.message && (
                    <p className="text-xs text-muted-foreground leading-relaxed">"{step.message}"</p>
                  )}
                  {step.branches && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-[hsl(142,71%,45%)]">✅ Sim → {step.branches.yes}</p>
                      <p className="text-xs text-destructive">❌ Não → {step.branches.no}</p>
                    </div>
                  )}
                </motion.div>
              </div>
            ))}
          </div>

          {/* Stats */}
          {flow.detail?.stats && (
            <div className="max-w-md mx-auto mt-6 bg-[hsl(0,0%,10%)] border border-admin-card-border rounded-xl p-4">
              <p className="text-xs font-semibold text-foreground mb-2">📊 Resultados este mês</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>Disparado: {flow.detail.stats.triggered}x</span>
                {flow.detail.stats.responded !== undefined && (
                  <span>Responderam: {flow.detail.stats.responded} ({Math.round(flow.detail.stats.responded / flow.detail.stats.triggered * 100)}%)</span>
                )}
                {flow.detail.stats.ordered !== undefined && (
                  <span>Pediram: {flow.detail.stats.ordered} ({Math.round(flow.detail.stats.ordered / flow.detail.stats.triggered * 100)}%)</span>
                )}
                {flow.detail.stats.revenue && <span>Gerado: {flow.detail.stats.revenue}</span>}
              </div>
            </div>
          )}
        </div>

        {/* AI Assistant */}
        <div className="md:w-[30%] h-[45vh] md:h-auto border-t md:border-t-0 md:border-l border-admin-card-border bg-[hsl(0,0%,7%)] flex flex-col"
          style={{ borderLeftColor: "hsl(var(--primary))", borderLeftWidth: "2px" }}>
          {/* Assistant header */}
          <div className="px-4 py-3 border-b border-admin-card-border shrink-0">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[hsl(var(--primary))]" />
              <span className="text-sm font-semibold text-foreground">Assistente FoodWaker</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Powered by IA</p>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] rounded-xl px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[hsl(var(--primary))] text-white rounded-br-sm"
                      : "bg-[hsl(0,0%,10%)] border border-admin-card-border text-foreground rounded-bl-sm"
                  }`}>
                    {msg.role === "assistant" && <Zap size={12} className="text-[hsl(var(--primary))] mb-1" />}
                    {msg.content}
                    {msg.actions && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.actions.map((a) => (
                          <button key={a.action} onClick={() => handleAction(a.action)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[hsl(0,0%,15%)] border border-admin-card-border text-foreground hover:border-[hsl(var(--primary))] transition-colors">
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 px-3 py-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]"
                      animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-1">digitando...</span>
              </motion.div>
            )}

            {/* Suggestions after initial message */}
            {messages.length === 1 && !typing && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {suggestions.map((s) => (
                  <button key={s.label} onClick={() => sendMessage(s.label)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-[hsl(0,0%,10%)] border border-admin-card-border text-foreground hover:border-[hsl(var(--primary))] transition-colors">
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-admin-card-border shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
                placeholder="Digite sua solicitação..."
                className="flex-1 bg-[hsl(0,0%,10%)] border border-admin-card-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(var(--primary))] transition-colors"
              />
              <button onClick={() => sendMessage(input)} disabled={!input.trim()}
                className="bg-[hsl(var(--primary))] text-white rounded-lg px-3 py-2 disabled:opacity-40 hover:opacity-90 transition-opacity">
                <Zap size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit message modal */}
      <AnimatePresence>
        {editingIdx !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setEditingIdx(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[hsl(0,0%,7%)] border border-admin-card-border rounded-2xl w-full max-w-md p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">✏️ Editando: {steps[editingIdx]?.label}</h3>
                <button onClick={() => setEditingIdx(null)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
              </div>
              <Textarea value={editMsg} onChange={(e) => setEditMsg(e.target.value)}
                className="bg-[hsl(0,0%,10%)] border-admin-card-border min-h-[80px] text-sm" />
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Variáveis:</p>
                <div className="flex flex-wrap gap-1.5">
                  {variables.map((v) => (
                    <button key={v} onClick={() => setEditMsg(prev => prev + " " + v)}
                      className="text-xs px-2 py-1 rounded-lg bg-[hsl(0,0%,10%)] text-[hsl(var(--primary))] border border-admin-card-border hover:border-[hsl(var(--primary))]/50 transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-[hsl(0,0%,10%)] border border-admin-card-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                <p className="text-xs text-foreground">"{previewMsg}"</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingIdx(null)} className="flex-1 h-10 border-admin-card-border rounded-xl text-xs">Cancelar</Button>
                <Button onClick={saveEdit} className="flex-1 h-10 bg-[hsl(var(--primary))] rounded-xl text-xs">💾 Salvar</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

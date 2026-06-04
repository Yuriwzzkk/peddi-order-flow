import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface FlowStep {
  icon: string;
  label: string;
  message?: string;
  editable?: boolean;
  branches?: { yes: string; no: string };
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  actions?: { label: string; action: string }[];
  suggestions?: string[];
}

interface CreatedFlow {
  name: string;
  steps: FlowStep[];
}

const initialSuggestions = [
  "🤖 Criar atendimento automático",
  "📢 Recuperar clientes inativos",
  "🎯 Fazer upsell de produto",
  "🎁 Criar promoção",
  "⏰ Responder fora do horário",
  "✨ Tenho uma ideia própria",
];

function getCreationAIResponse(msg: string): {
  content: string;
  actions?: { label: string; action: string }[];
  suggestions?: string[];
  flowSteps?: FlowStep[];
  flowName?: string;
} {
  const lower = msg.toLowerCase();

  if (lower.includes("não sei") || lower.includes("por onde começar") || lower.includes("ajuda")) {
    return {
      content: "Sem problema! Vou te fazer algumas perguntas simples. 😊\n\nPrimeira: quando um cliente novo manda mensagem no seu WhatsApp pela primeira vez, o que você quer que aconteça?",
      suggestions: [
        "🤖 Bot responde automaticamente",
        "👨‍💼 Vai direto pro atendente",
        "🍽️ Já mostra o cardápio",
      ],
    };
  }

  if (lower.includes("bot responde") || lower.includes("automaticamente")) {
    return {
      content: "Ótimo! E qual tom de voz combina mais com seu restaurante?",
      suggestions: [
        '😊 Amigável: "Oi! Tudo bem?"',
        '🔥 Animado: "Eaí! Bora pedir?"',
        '🎩 Formal: "Bem-vindo!"',
      ],
    };
  }

  if (lower.includes("animado") || lower.includes("bora pedir") || lower.includes("🔥")) {
    const steps: FlowStep[] = [
      { icon: "📩", label: "Primeira mensagem", message: "Cliente envia primeira mensagem" },
      { icon: "💬", label: "Boas-vindas", message: "Eaí {nome}! 🔥 Bem-vindo ao {restaurante}! Bora pedir?", editable: true },
      { icon: "🍽️", label: "Exibir cardápio", message: "Mostra categorias como botões clicáveis" },
      { icon: "✅", label: "Confirmação", message: "Pedido recebido! Já tá saindo 🔥", editable: true },
    ];
    return {
      content: 'Perfeito! Criando seu fluxo... ✨\n\nPronto! Criei isso pra você:\n\n📱 Mensagem de boas-vindas:\n"Eaí {nome}! 🔥 Bem-vindo ao {restaurante}! Bora pedir?"\n\nQuer ajustar algo ou adicionar mais etapas?',
      actions: [
        { label: "✅ Ficou ótimo!", action: "finalize" },
        { label: "✏️ Ajustar mensagem", action: "adjust" },
        { label: "➕ Adicionar mais etapas", action: "more_steps" },
      ],
      flowSteps: steps,
      flowName: "Atendimento automático",
    };
  }

  if (lower.includes("amigável") || lower.includes("oi! tudo bem") || lower.includes("😊")) {
    const steps: FlowStep[] = [
      { icon: "📩", label: "Primeira mensagem", message: "Cliente envia primeira mensagem" },
      { icon: "💬", label: "Boas-vindas", message: "Oi {nome}! Tudo bem? 😊 Bem-vindo ao {restaurante}!", editable: true },
      { icon: "🍽️", label: "Exibir cardápio", message: "Mostra categorias como botões clicáveis" },
      { icon: "✅", label: "Confirmação", message: "Pedido recebido! Em breve confirmamos 🎉", editable: true },
    ];
    return {
      content: 'Perfeito! Criando seu fluxo... ✨\n\nPronto! Criei isso pra você:\n\n📱 Mensagem de boas-vindas:\n"Oi {nome}! Tudo bem? 😊 Bem-vindo ao {restaurante}!"\n\nQuer ajustar algo ou adicionar mais etapas?',
      actions: [
        { label: "✅ Ficou ótimo!", action: "finalize" },
        { label: "✏️ Ajustar mensagem", action: "adjust" },
        { label: "➕ Adicionar mais etapas", action: "more_steps" },
      ],
      flowSteps: steps,
      flowName: "Atendimento automático",
    };
  }

  if (lower.includes("formal") || lower.includes("bem-vindo") || lower.includes("🎩")) {
    const steps: FlowStep[] = [
      { icon: "📩", label: "Primeira mensagem", message: "Cliente envia primeira mensagem" },
      { icon: "💬", label: "Boas-vindas", message: "Bem-vindo ao {restaurante}, {nome}. Como posso ajudá-lo?", editable: true },
      { icon: "🍽️", label: "Exibir cardápio", message: "Mostra categorias como botões clicáveis" },
      { icon: "✅", label: "Confirmação", message: "Pedido registrado com sucesso. Obrigado pela preferência.", editable: true },
    ];
    return {
      content: 'Perfeito! Criando seu fluxo... ✨\n\nPronto! Criei isso pra você:\n\n📱 Mensagem de boas-vindas:\n"Bem-vindo ao {restaurante}, {nome}. Como posso ajudá-lo?"\n\nQuer ajustar algo ou adicionar mais etapas?',
      actions: [
        { label: "✅ Ficou ótimo!", action: "finalize" },
        { label: "✏️ Ajustar mensagem", action: "adjust" },
        { label: "➕ Adicionar mais etapas", action: "more_steps" },
      ],
      flowSteps: steps,
      flowName: "Atendimento automático",
    };
  }

  if (lower.includes("cardápio") || lower.includes("mostra o cardápio") || lower.includes("🍽️")) {
    const steps: FlowStep[] = [
      { icon: "📩", label: "Primeira mensagem", message: "Cliente envia primeira mensagem" },
      { icon: "🍽️", label: "Exibir cardápio", message: "Mostra o cardápio completo direto" },
      { icon: "🛒", label: "Aguardar escolha", message: "Espera o cliente escolher um produto" },
      { icon: "✅", label: "Confirmação", message: "Pedido recebido! 🎉", editable: true },
    ];
    return {
      content: 'Feito! Criei um fluxo direto ao ponto — quando o cliente mandar qualquer mensagem, já mostra o cardápio. 🍽️\n\nQuer ajustar algo?',
      actions: [
        { label: "✅ Ficou ótimo!", action: "finalize" },
        { label: "➕ Adicionar boas-vindas antes", action: "more_steps" },
      ],
      flowSteps: steps,
      flowName: "Cardápio direto",
    };
  }

  if (lower.includes("atendente") || lower.includes("👨‍💼")) {
    const steps: FlowStep[] = [
      { icon: "📩", label: "Primeira mensagem", message: "Cliente envia primeira mensagem" },
      { icon: "💬", label: "Aviso", message: "Olá! Um atendente vai te responder em instantes 😊", editable: true },
      { icon: "👨‍💼", label: "Transferir para atendente", message: "Transfere conversa para atendente humano" },
    ];
    return {
      content: 'Entendido! Criei um fluxo simples — manda uma mensagem de aviso e transfere direto pro atendente. 👨‍💼\n\nQuer personalizar a mensagem?',
      actions: [
        { label: "✅ Ficou ótimo!", action: "finalize" },
        { label: "✏️ Ajustar mensagem", action: "adjust" },
      ],
      flowSteps: steps,
      flowName: "Transferir para atendente",
    };
  }

  if (lower.includes("upsell") || lower.includes("oferecer") || lower.includes("sugerir") || lower.includes("milk shake") || lower.includes("batata")) {
    const steps: FlowStep[] = [
      { icon: "🛒", label: "Produto adicionado", message: "Cliente adicionou produto ao carrinho" },
      { icon: "🎯", label: "Oferecer upsell", message: "Que tal uma 🍟 Batata Frita por só +R$12,90? Combina demais!", editable: true },
      { icon: "👂", label: "Aguardar resposta", message: "Espera o cliente aceitar ou recusar" },
      { icon: "✅", label: "Confirmação", message: "Adicionado ao pedido! 🎉", editable: true },
    ];
    return {
      content: 'Entendi! Criei um fluxo de upsell — quando o cliente adicionar um produto, o bot sugere um complemento. 🎯\n\nMédia de aceitação desse tipo de oferta: 28% 📊\n\nQuer ajustar a mensagem ou ativar?',
      actions: [
        { label: "✅ Ativar agora", action: "finalize" },
        { label: "✏️ Ajustar mensagem", action: "adjust" },
        { label: "➕ Adicionar mais regras", action: "more_steps" },
      ],
      flowSteps: steps,
      flowName: "Upsell automático",
    };
  }

  if (lower.includes("inativo") || lower.includes("sumiu") || lower.includes("falta") || lower.includes("recuperar") || lower.includes("📢")) {
    const steps: FlowStep[] = [
      { icon: "⏰", label: "Cliente inativo", message: "Cliente inativo há 7 dias" },
      { icon: "💬", label: "Mensagem", message: "Oi {nome}! Sentimos sua falta! 😢 Que tal 15% OFF? Código: VOLTEI15", editable: true },
      { icon: "🔀", label: "Respondeu?", branches: { yes: "Exibir cardápio", no: "Encerrar" } },
    ];
    return {
      content: 'Perfeito! Criei um fluxo de recuperação — quando um cliente ficar 7 dias sem pedir, o bot manda uma oferta especial. 📈\n\nQuer personalizar?',
      actions: [
        { label: "✅ Ativar agora", action: "finalize" },
        { label: "✏️ Personalizar mensagem", action: "adjust" },
      ],
      flowSteps: steps,
      flowName: "Recuperação de clientes",
    };
  }

  if (lower.includes("promoção") || lower.includes("promo") || lower.includes("🎁")) {
    const steps: FlowStep[] = [
      { icon: "📅", label: "Gatilho", message: "Sexta-feira às 18h" },
      { icon: "💬", label: "Mensagem", message: "🎉 Promoção de fim de semana! 20% OFF em combos! Corre que é só até domingo!", editable: true },
    ];
    return {
      content: 'Criei uma promoção de fim de semana! Toda sexta às 18h, seus clientes recebem uma mensagem com desconto. 🎁\n\nQuer ajustar?',
      actions: [
        { label: "✅ Ativar agora", action: "finalize" },
        { label: "✏️ Personalizar", action: "adjust" },
      ],
      flowSteps: steps,
      flowName: "Promoção fim de semana",
    };
  }

  if (lower.includes("horário") || lower.includes("fechado") || lower.includes("fora do horário") || lower.includes("⏰")) {
    const steps: FlowStep[] = [
      { icon: "🌙", label: "Fora do horário", message: "Restaurante está fechado" },
      { icon: "💬", label: "Resposta", message: "Ops, estamos fechados agora! 😴 Nosso horário é das {horario}. Mas pode fazer seu pedido que entregamos assim que abrirmos! 🚀", editable: true },
    ];
    return {
      content: 'Feito! Criei resposta automática para fora do horário. 🌙\n\nQuando o restaurante estiver fechado, o bot avisa o horário e permite fazer pedido antecipado.\n\nQuer ajustar?',
      actions: [
        { label: "✅ Ativar agora", action: "finalize" },
        { label: "✏️ Personalizar", action: "adjust" },
      ],
      flowSteps: steps,
      flowName: "Fora do horário",
    };
  }

  if (lower.includes("gatilho") || lower.includes("o que é")) {
    return {
      content: "Ótima pergunta! 😊\n\nGatilho é o que \"aciona\" uma automação. É o evento que faz o bot agir.\n\nExemplos de gatilhos:\n\n⚡ Cliente mandou \"oi\"\n⚡ Cliente ficou 7 dias sem pedir\n⚡ Pedido foi confirmado\n⚡ Cliente escolheu um produto\n\nQuando o gatilho acontece, o bot executa uma ação — como mandar uma mensagem ou mostrar o cardápio.\n\nQuer criar uma automação usando algum desses gatilhos?",
      suggestions: ["⚡ Sim, criar agora", "❓ Tenho mais dúvidas"],
    };
  }

  // Default: if user types something specific like "quando o cliente digitar oi..."
  if (lower.includes("oi") || lower.includes("olá") || lower.includes("digitar")) {
    const steps: FlowStep[] = [
      { icon: "🔑", label: "Palavra-chave", message: 'Detecta: "oi", "olá", "boa tarde"' },
      { icon: "💬", label: "Resposta", message: "Olá! Bem-vindo ao Burger House!", editable: true },
    ];
    return {
      content: 'Entendido! ✅\n\nToda vez que alguém mandar "oi", "olá", "boa tarde" ou qualquer saudação, seu bot vai responder:\n\n"Olá! Bem-vindo ao Burger House!"\n\nQuer adicionar mais alguma coisa depois dessa mensagem?',
      actions: [
        { label: "🍽️ Mostrar cardápio", action: "add_menu" },
        { label: "🔘 Adicionar botões de opção", action: "more_steps" },
        { label: "✅ Não, só isso mesmo", action: "finalize" },
      ],
      flowSteps: steps,
      flowName: "Saudação automática",
    };
  }

  return {
    content: "Entendi! 😊 Me conta mais sobre o que você quer automatizar. Posso criar fluxos como:\n\n🤖 Atendimento automático\n📢 Recuperação de clientes\n🎯 Upsell de produtos\n🎁 Promoções\n⏰ Resposta fora do horário\n\nDescreve com suas palavras o que precisa!",
  };
}

interface Props {
  onClose: () => void;
  onFlowCreated: (flow: { name: string; icon: string; steps: FlowStep[] }) => void;
}

export default function AICreateFlowModal({ onClose, onFlowCreated }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content: "Olá! Vou te ajudar a criar uma automação do zero. 🚀\n\nMe conta: o que você quer que aconteça no seu WhatsApp?\n\nPode ser simples assim:\n\"Quando o cliente digitar oi, quero mandar uma mensagem de boas-vindas\"\n\nOu mais específico:\n\"Quero oferecer milk shake para quem pedir apenas 1 item\"\n\nÉ só descrever com suas palavras mesmo! 😊",
      suggestions: initialSuggestions,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [canvasSteps, setCanvasSteps] = useState<FlowStep[]>([]);
  const [flowName, setFlowName] = useState("");
  const [showFinalize, setShowFinalize] = useState(false);
  const [editName, setEditName] = useState("");
  const [buildingCanvas, setBuildingCanvas] = useState(false);
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
      const resp = getCreationAIResponse(text);
      if (resp.flowSteps) {
        setBuildingCanvas(true);
        setTimeout(() => {
          setCanvasSteps(resp.flowSteps!);
          setFlowName(resp.flowName || "Novo fluxo");
          setEditName(resp.flowName || "Novo fluxo");
          setBuildingCanvas(false);
        }, 1500);
      }
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: resp.content,
        actions: resp.actions,
        suggestions: resp.suggestions,
      };
      setMessages(prev => [...prev, aiMsg]);
    }, delay);
  };

  const handleAction = (action: string) => {
    if (action === "finalize") {
      setShowFinalize(true);
    } else if (action === "adjust") {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: "assistant",
        content: "Claro! Qual mensagem você quer alterar? Pode me dizer o novo texto que eu atualizo no fluxo. 😊",
      }]);
    } else if (action === "more_steps") {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: "assistant",
        content: "O que mais você quer adicionar ao fluxo? Posso incluir:\n\n🎯 Upsell de produto\n⏰ Verificar horário\n🔀 Condição (se/senão)\n💬 Mais uma mensagem\n\nÉ só descrever! 😊",
      }]);
    } else if (action === "add_menu") {
      const menuStep: FlowStep = { icon: "🍽️", label: "Exibir cardápio", message: "Mostra categorias como botões clicáveis" };
      setCanvasSteps(prev => [...prev, menuStep]);
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: "assistant",
        content: "Adicionei o cardápio logo após a mensagem! 🍽️\n\nQuer finalizar ou adicionar mais?",
        actions: [
          { label: "✅ Ficou ótimo!", action: "finalize" },
          { label: "➕ Mais etapas", action: "more_steps" },
        ],
      }]);
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: "assistant",
        content: "Ok! Se precisar de mais alguma coisa, é só falar. 😊",
      }]);
    }
  };

  const handleSaveFlow = (activate: boolean) => {
    const iconMap: Record<string, string> = {
      "Atendimento automático": "🤖",
      "Upsell automático": "🎯",
      "Recuperação de clientes": "📢",
      "Promoção fim de semana": "🎁",
      "Fora do horário": "🌙",
      "Saudação automática": "💬",
      "Cardápio direto": "🍽️",
      "Transferir para atendente": "👨‍💼",
    };
    const name = editName.trim() || flowName;
    onFlowCreated({
      name,
      icon: iconMap[flowName] || "⚡",
      steps: canvasSteps,
    });
    toast.success(activate ? "Automação ativada! 🎉" : "Salvo como rascunho!");
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[hsl(0,0%,5%)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-admin-card-border bg-[hsl(0,0%,7%)] shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm text-muted-foreground">Voltar</span>
        <div className="flex items-center gap-2 ml-4">
          <Zap size={16} className="text-[hsl(var(--primary))]" />
          <span className="text-sm font-semibold text-foreground">Criar automação com IA</span>
        </div>
      </div>

      {/* Main split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Canvas preview */}
        <div className="flex-1 md:w-[60%] h-[55vh] md:h-auto overflow-y-auto p-6"
          style={{ background: "#0D0D0D", backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>

          {showFinalize ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto space-y-6">
              <div className="text-center">
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                  className="text-5xl block mb-3">🎉</motion.span>
                <h2 className="text-lg font-bold text-foreground">Automação criada!</h2>
              </div>

              {/* Mini flow preview */}
              <div className="space-y-0">
                {canvasSteps.map((step, idx) => (
                  <div key={idx}>
                    {idx > 0 && (
                      <div className="flex justify-center py-1">
                        <div className="w-0.5 h-6 bg-[hsl(var(--primary))]/40" />
                      </div>
                    )}
                    <div className="bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{step.icon}</span>
                        <span className="text-xs font-semibold text-foreground">{step.label}</span>
                      </div>
                      {step.message && <p className="text-xs text-muted-foreground mt-1">"{step.message}"</p>}
                      {step.branches && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs text-[hsl(142,71%,45%)]">✅ {step.branches.yes}</p>
                          <p className="text-xs text-destructive">❌ {step.branches.no}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Nome da automação:</label>
                <Input value={editName} onChange={e => setEditName(e.target.value)}
                  className="bg-[hsl(0,0%,10%)] border-admin-card-border rounded-xl h-11 text-sm" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSaveFlow(false)}
                  className="flex-1 h-11 border-admin-card-border rounded-xl text-xs">
                  💾 Salvar como rascunho
                </Button>
                <Button onClick={() => handleSaveFlow(true)}
                  className="flex-1 h-11 bg-[hsl(var(--primary))] rounded-xl text-xs">
                  <Check size={14} /> Ativar agora
                </Button>
              </div>
            </motion.div>
          ) : canvasSteps.length === 0 && !buildingCanvas ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Seu fluxo aparecerá aqui conforme você conversa com a IA ✨
              </p>
            </div>
          ) : buildingCanvas ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full" />
              <p className="text-sm text-muted-foreground">Criando fluxo...</p>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-0">
              {canvasSteps.map((step, idx) => (
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
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: idx * 0.15, duration: 0.3 }}
                    className="bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] rounded-xl p-4"
                    style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{step.icon}</span>
                      <span className="text-sm font-semibold text-foreground">{step.label}</span>
                    </div>
                    {step.message && <p className="text-xs text-muted-foreground leading-relaxed">"{step.message}"</p>}
                    {step.branches && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-[hsl(142,71%,45%)]">✅ Sim → {step.branches.yes}</p>
                        <p className="text-xs text-destructive">❌ Não → {step.branches.no}</p>
                      </div>
                    )}
                  </motion.div>
                </div>
              ))}
              {flowName && (
                <div className="text-center mt-4">
                  <p className="text-xs text-muted-foreground">Fluxo: <span className="text-foreground font-medium">{flowName}</span></p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="md:w-[40%] h-[45vh] md:h-auto border-t md:border-t-0 md:border-l border-admin-card-border bg-[hsl(0,0%,7%)] flex flex-col"
          style={{ borderLeftColor: "hsl(var(--primary))", borderLeftWidth: "2px" }}>
          <div className="px-4 py-3 border-b border-admin-card-border shrink-0">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[hsl(var(--primary))]" />
              <span className="text-sm font-semibold text-foreground">Assistente FoodWaker</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Powered by IA</p>
          </div>

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
                    {msg.suggestions && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.suggestions.map((s) => (
                          <button key={s} onClick={() => sendMessage(s)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-[hsl(0,0%,15%)] border border-admin-card-border text-foreground hover:border-[hsl(var(--primary))] transition-colors">
                            {s}
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
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-admin-card-border shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
                placeholder="Descreva o que quer automatizar..."
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
    </motion.div>
  );
}

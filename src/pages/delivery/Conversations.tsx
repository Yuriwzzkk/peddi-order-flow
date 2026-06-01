import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Send, ClipboardList, Bot, User, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { listConversations, getConversation, sendMessage } from "@/services/conversations";
import type { Conversation, Message } from "@/types";

function formatTime(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatTimeChat(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const statusLabels: Record<string, string> = {
  open: "Aberto",
  closed: "Finalizado",
  waiting: "Aguardando",
};

const statusColors: Record<string, string> = {
  open: "bg-status-new",
  closed: "bg-status-ready",
  waiting: "bg-status-preparing",
};

const quickReplies = [
  "Seu pedido está sendo preparado!",
  "Seu pedido saiu para entrega!",
  "Obrigado pela preferência!",
];

export default function DeliveryConversations() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [quickReplyOpen, setQuickReplyOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.restaurant_id) return;
    (async () => {
      try {
        const data = await listConversations(profile.restaurant_id);
        setConversations(data);
      } catch {
        toast.error("Erro ao carregar conversas");
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.restaurant_id]);

  useEffect(() => {
    if (!isMobile && conversations.length > 0 && !selected) {
      setSelected(conversations[0]);
    }
  }, [conversations, isMobile, selected]);

  const handleSelect = async (conv: Conversation) => {
    setSelected(conv);
    setMessages([]);
    try {
      const full = await getConversation(conv.id);
      if (full) setMessages(full.messages ?? []);
    } catch {
      toast.error("Erro ao carregar mensagens");
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selected) return;
    const text = message.trim();
    setMessage("");
    const optimistic: Message = {
      id: crypto.randomUUID(),
      conversation_id: selected.id,
      sender: "attendant",
      text,
      message_type: "text",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      await sendMessage(selected.id, "attendant", text);
    } catch {
      toast.error("Erro ao enviar mensagem");
    }
  };

  const filteredConvos = conversations.filter((c) =>
    c.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const confirmPayment = (method: string) => {
    setPaymentOpen(false);
    toast.success(`Pagamento confirmado via ${method}! Mensagem automática enviada ao cliente.`);
  };

  const ConvoList = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-admin-card-border">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar conversa..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-admin-card-border h-10 text-sm" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Carregando...</div>
        ) : filteredConvos.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Nenhuma conversa encontrada</div>
        ) : (
          filteredConvos.map((c) => (
            <button key={c.id} onClick={() => handleSelect(c)}
              className={`w-full flex items-center gap-3 p-3 border-b border-admin-card-border hover:bg-secondary/50 transition-colors text-left ${selected?.id === c.id ? "bg-secondary" : ""}`}>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">{c.customer_name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground truncate">{c.customer_name}</span>
                  <span className="text-[10px] text-muted-foreground">{formatTime(c.last_message_at)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{statusLabels[c.status] ?? c.status}</p>
              </div>
              {c.unread_count > 0 && <span className="w-5 h-5 bg-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center shrink-0">{c.unread_count}</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );

  const ChatView = () => {
    if (!selected) return null;
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-3 border-b border-admin-card-border">
          {isMobile && <button onClick={() => setSelected(null)} className="p-1"><ArrowLeft size={20} className="text-foreground" /></button>}
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">{selected.customer_name[0]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{selected.customer_name}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${statusColors[selected.status] ?? "bg-status-new"}`}>
              {statusLabels[selected.status] ?? selected.status}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Nenhuma mensagem ainda</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${msg.sender === "client" ? "bg-secondary text-foreground rounded-bl-sm" : "bg-primary/20 text-foreground rounded-br-sm"}`}>
                  {msg.sender !== "client" && (
                    <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                      {msg.sender === "bot" ? <><Bot size={10} /> Bot</> : <><User size={10} /> Atendente</>}
                    </p>
                  )}
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <p className="text-[10px] text-muted-foreground text-right mt-1">{formatTimeChat(msg.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 border-t border-admin-card-border">
          <Sheet open={quickReplyOpen} onOpenChange={setQuickReplyOpen}>
            <SheetTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><ClipboardList size={18} /></button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-admin-nav border-admin-card-border rounded-t-2xl">
              <SheetHeader><SheetTitle className="text-foreground">Respostas rápidas</SheetTitle></SheetHeader>
              <div className="space-y-2 py-4">
                {quickReplies.map((r, i) => (
                  <button key={i} onClick={() => { setMessage(r); setQuickReplyOpen(false); }}
                    className="w-full text-left p-3 rounded-xl bg-secondary border border-admin-card-border text-sm text-foreground hover:bg-primary/10 transition-colors">{r}</button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={paymentOpen} onOpenChange={setPaymentOpen}>
            <SheetTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><CreditCard size={18} /></button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-admin-nav border-admin-card-border rounded-t-2xl">
              <SheetHeader><SheetTitle className="text-foreground">Confirmar pagamento</SheetTitle></SheetHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm text-muted-foreground">Pedido em andamento</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{ icon: "📱", label: "Pix" }, { icon: "💳", label: "Cartão" }, { icon: "💵", label: "Dinheiro" }].map(m => (
                    <button key={m.label} onClick={() => confirmPayment(m.label)}
                      className="p-4 rounded-xl bg-secondary border border-admin-card-border hover:border-primary/30 transition-colors text-center">
                      <span className="text-2xl">{m.icon}</span>
                      <p className="text-xs text-foreground mt-1">{m.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center gap-2 p-3 border-t border-admin-card-border">
          <Input placeholder="Digite uma mensagem..." value={message} onChange={(e) => setMessage(e.target.value)}
            className="bg-secondary border-admin-card-border h-11 text-sm flex-1" />
          <Button size="icon" onClick={handleSend} className="h-11 w-11 bg-primary hover:bg-primary-hover rounded-xl shrink-0"><Send size={18} /></Button>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-8rem)] -m-4 flex flex-col bg-background">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key="chat" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="flex-1 flex flex-col"><ChatView /></motion.div>
          ) : (
            <motion.div key="list" initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="flex-1 flex flex-col"><ConvoList /></motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] -m-4 flex bg-background">
      <div className="w-[35%] border-r border-admin-card-border flex flex-col"><ConvoList /></div>
      <div className="flex-1 flex flex-col">
        {selected ? <ChatView /> : <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Selecione uma conversa</div>}
      </div>
    </div>
  );
}

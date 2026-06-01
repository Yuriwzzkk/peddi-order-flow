import { useEffect, useState, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Send, ClipboardList, Utensils, Bot, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { listConversations, sendMessage, toggleConversationMode, getConversation } from "@/services/conversations";
import { supabase } from "@/lib/supabase";
import type { Conversation, Message } from "@/types";

const quickReplies = [
  "Seu pedido está sendo preparado! 🍳",
  "Seu pedido saiu para entrega! 🛵",
  "Obrigado pela preferência! ❤️",
];

export default function Conversations() {
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const restaurantId = profile?.restaurant_id;
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [botActive, setBotActive] = useState(true);
  const [quickReplyOpen, setQuickReplyOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    listConversations(restaurantId)
      .then(setConvos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [restaurantId]);

  useEffect(() => {
    if (!selected) return;
    getConversation(selected.id).then(conv => {
      if (conv) {
        setMessages(conv.messages || []);
        setBotActive(conv.mode === "bot");
      }
    });
  }, [selected?.id]);

  useEffect(() => {
    if (!selected?.id) return;
    const channel = supabase
      .channel(`messages-${selected.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selected.id}` },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMsg.id, conversation_id: newMsg.conversation_id,
            sender: newMsg.sender, text: newMsg.text,
            message_type: newMsg.message_type || "text", created_at: newMsg.created_at,
          }]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected?.id]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !selected) return;
    try {
      const msg = await sendMessage(selected.id, "attendant", message.trim());
      setMessages(prev => [...prev, msg]);
      setMessage("");
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleMode = async (mode: boolean) => {
    if (!selected) return;
    setBotActive(mode);
    try { await toggleConversationMode(selected.id, mode ? "bot" : "attendant"); }
    catch (err) { setBotActive(!mode); }
  };

  const filteredConvos = convos.filter(c =>
    c.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="text-center text-muted-foreground py-8 text-sm">Carregando...</div>
        ) : (
          filteredConvos.map((c) => (
            <button key={c.id} onClick={() => setSelected(c)}
              className={`w-full flex items-center gap-3 p-3 border-b border-admin-card-border hover:bg-secondary/50 transition-colors text-left ${selected?.id === c.id ? "bg-secondary" : ""}`}>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                {c.customer_name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground truncate">{c.customer_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.status}</p>
              </div>
              {c.unread_count > 0 && (
                <span className="w-5 h-5 bg-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center shrink-0">
                  {c.unread_count}
                </span>
              )}
            </button>
          ))
        )}
        {!loading && filteredConvos.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Nenhuma conversa</p>
        )}
      </div>
    </div>
  );

  const ChatView = () => {
    if (!selected) return null;
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-3 border-b border-admin-card-border">
          {isMobile && (
            <button onClick={() => setSelected(null)} className="p-1">
              <ArrowLeft size={20} className="text-foreground" />
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
            {selected.customer_name?.[0] || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{selected.customer_name}</p>
            <span className="text-[10px] text-muted-foreground">{selected.status}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                msg.sender === "client"
                  ? "bg-secondary text-foreground rounded-bl-sm"
                  : "bg-primary/20 text-foreground rounded-br-sm"
              }`}>
                {msg.sender !== "client" && (
                  <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                    {msg.sender === "bot" ? <><Bot size={10} /> Bot</> : <><User size={10} /> Atendente</>}
                  </p>
                )}
                <p className="whitespace-pre-line">{msg.text}</p>
                <p className="text-[10px] text-muted-foreground text-right mt-1">
                  {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          <div ref={chatEnd} />
        </div>

        <div className="flex items-center gap-2 px-3 py-2 border-t border-admin-card-border">
          <Sheet open={quickReplyOpen} onOpenChange={setQuickReplyOpen}>
            <SheetTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground" title="Respostas rápidas">
                <ClipboardList size={18} />
              </button>
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
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[10px] text-muted-foreground">{botActive ? "Bot" : "Atendente"}</span>
            <Switch checked={botActive} onCheckedChange={handleToggleMode} className="scale-75" />
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 border-t border-admin-card-border">
          <Input placeholder="Digite uma mensagem..." value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="bg-secondary border-admin-card-border h-11 text-sm flex-1" />
          <Button size="icon" onClick={handleSend}
            className="h-11 w-11 bg-primary hover:bg-primary-hover rounded-xl shrink-0">
            <Send size={18} />
          </Button>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-8rem)] -m-4 flex flex-col bg-background">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key="chat" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="flex-1 flex flex-col">
              <ChatView />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="flex-1 flex flex-col">
              <ConvoList />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] -m-4 flex bg-background">
      <div className="w-[35%] border-r border-admin-card-border flex flex-col">
        <ConvoList />
      </div>
      <div className="flex-1 flex flex-col">
        {selected ? <ChatView /> : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Selecione uma conversa
          </div>
        )}
      </div>
    </div>
  );
}

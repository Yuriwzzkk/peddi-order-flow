import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { Phone, Video, MoreVertical } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "client" | "bot";
  type?: "main-buttons" | "menu-items" | "add-buttons" | "post-add" | "attendant" | "finalized";
  category?: string;
}

interface MenuItem {
  name: string;
  price: string;
}

const menus: Record<string, { reply: string; items: MenuItem[] }> = {
  "🍔 Hambúrgueres": {
    reply: "Veja nosso cardápio! 🔥",
    items: [
      { name: "X-Burguer", price: "R$24,90" },
      { name: "Smash Burguer", price: "R$29,90" },
      { name: "Duplo Bacon", price: "R$34,90" },
    ],
  },
  "🥤 Bebidas": {
    reply: "Nossas bebidas geladas! 🥶",
    items: [
      { name: "Coca-Cola", price: "R$7,90" },
      { name: "Suco de Laranja", price: "R$9,90" },
      { name: "Água", price: "R$4,90" },
    ],
  },
  "🎁 Combos": {
    reply: "Combos especiais com desconto! 🎁",
    items: [
      { name: "Combo Burguer", price: "R$44,90" },
      { name: "Combo Kids", price: "R$29,90" },
    ],
  },
};

const mainButtons = ["🍔 Hambúrgueres", "🥤 Bebidas", "🎁 Combos", "👨‍🍳 Falar com atendente"];

let msgCounter = 0;
const nextId = () => `msg-${++msgCounter}`;

export function WhatsAppMockup() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  const addMessages = useCallback((...msgs: Message[]) => {
    setMessages((prev) => [...prev, ...msgs]);
  }, []);

  // Start conversation on mount — only once
  useEffect(() => {
    if (!started) {
      setStarted(true);
      setTimeout(() => {
        addMessages({
          id: nextId(),
          text: "Olá! 👋 Bem-vindo ao Peddi. Como posso te ajudar?",
          sender: "bot",
          type: "main-buttons",
        });
      }, 600);
    }
  }, [started, addMessages]);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  const handleMainButton = (btn: string) => {
    const clientMsg: Message = { id: nextId(), text: btn, sender: "client" };
    addMessages(clientMsg);

    if (btn === "👨‍🍳 Falar com atendente") {
      setTimeout(() => {
        addMessages({
          id: nextId(),
          text: "Estou te transferindo para um atendente humano. Aguarde um momento! 😊",
          sender: "bot",
        });
      }, 400);
      setTimeout(() => {
        addMessages({
          id: nextId(),
          text: "✅ Atendente entrou na conversa",
          sender: "bot",
          type: "attendant",
        });
      }, 1000);
      return;
    }

    const menu = menus[btn];
    if (menu) {
      setTimeout(() => {
        addMessages({
          id: nextId(),
          text: menu.reply,
          sender: "bot",
          type: "menu-items",
          category: btn,
        });
      }, 500);
    }
  };

  const handleAddItem = (itemName: string) => {
    addMessages({ id: nextId(), text: `+ ${itemName}`, sender: "client" });
    setTimeout(() => {
      addMessages({
        id: nextId(),
        text: "Adicionado! 🎉 Mais alguma coisa?",
        sender: "bot",
        type: "post-add",
      });
    }, 400);
  };

  const handleBackToMenu = () => {
    addMessages({ id: nextId(), text: "🔙 Menu principal", sender: "client" });
    setTimeout(() => {
      addMessages({
        id: nextId(),
        text: "Claro! O que deseja?",
        sender: "bot",
        type: "main-buttons",
      });
    }, 400);
  };

  const handleFinalize = () => {
    addMessages({ id: nextId(), text: "✅ Finalizar pedido", sender: "client" });
    setTimeout(() => {
      addMessages({
        id: nextId(),
        text: "Pedido recebido com sucesso! ✅ Em breve você receberá a confirmação.",
        sender: "bot",
        type: "finalized",
      });
    }, 500);
  };

  const handleNewOrder = () => {
    addMessages({ id: nextId(), text: "🔄 Novo pedido", sender: "client" });
    setTimeout(() => {
      addMessages({
        id: nextId(),
        text: "Olá! 👋 Bem-vindo ao Peddi. Como posso te ajudar?",
        sender: "bot",
        type: "main-buttons",
      });
    }, 400);
  };

  // Find last message with interactive buttons
  const lastButtonMsgIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type) return i;
    }
    return -1;
  })();

  return (
    <div className="relative">
      <div className="absolute inset-0 -m-8 rounded-3xl bg-[radial-gradient(circle,hsla(142,70%,45%,0.1)_0%,transparent_70%)] pointer-events-none" />

      <div
        className="relative w-full max-w-[340px] rounded-2xl overflow-hidden border border-border animate-float"
        style={{
          background: "hsl(0 0% 10%)",
          boxShadow: "0 25px 50px -12px hsla(0,0%,0%,0.5), 0 0 0 1px hsla(0,0%,100%,0.05)",
          transform: "rotate(2deg)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle" style={{ background: "hsl(0 0% 7%)" }}>
          <div className="w-9 h-9 rounded-full bg-[hsl(142,70%,45%)] flex items-center justify-center text-sm font-bold text-background">P</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Peddi 🍔</p>
            <p className="text-xs text-[hsl(142,70%,45%)]">online agora</p>
          </div>
          <div className="flex items-center gap-3 text-foreground-muted">
            <Video size={16} />
            <Phone size={16} />
            <MoreVertical size={16} />
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="h-[360px] overflow-y-auto px-3 py-4 flex flex-col gap-2 scroll-smooth" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence mode="sync">
            {messages.map((msg, idx) => {
              const isLastButtonMsg = idx === lastButtonMsgIndex;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex flex-col gap-1.5 max-w-[85%]">
                    <div
                      className={`px-3 py-2 rounded-xl text-sm ${
                        msg.sender === "client"
                          ? "bg-[hsl(142,70%,30%)] text-foreground rounded-br-sm"
                          : "bg-surface-2 text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Main buttons */}
                    {msg.type === "main-buttons" && isLastButtonMsg && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {mainButtons.map((btn, i) => (
                          <motion.button
                            key={btn}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.06 }}
                            onClick={() => handleMainButton(btn)}
                            className="px-2.5 py-1.5 text-xs rounded-lg bg-surface-2 border border-primary/30 text-foreground-muted cursor-pointer hover:border-primary hover:text-primary transition-colors duration-200"
                          >
                            {btn}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* Menu items */}
                    {msg.type === "menu-items" && isLastButtonMsg && msg.category && menus[msg.category] && (
                      <div className="flex flex-col gap-1.5 mt-1">
                        {menus[msg.category].items.map((item, i) => (
                          <motion.div
                            key={item.name}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.1 }}
                            className="px-3 py-2.5 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-between gap-2"
                          >
                            <div>
                              <p className="text-sm text-foreground">{item.name}</p>
                              <p className="text-xs font-bold text-primary">
                                {msg.category === "🎁 Combos" && (
                                  <span className="text-foreground-muted line-through mr-1.5 font-normal">
                                    {`R$${(parseFloat(item.price.replace("R$", "").replace(",", ".")) * 1.25).toFixed(2).replace(".", ",")}`}
                                  </span>
                                )}
                                {item.price}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAddItem(item.name)}
                              className="px-2 py-1 text-[10px] font-medium rounded-md bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all duration-150 whitespace-nowrap"
                            >
                              + Adicionar
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Post-add buttons */}
                    {msg.type === "post-add" && isLastButtonMsg && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <motion.button
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          onClick={handleFinalize}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-primary/15 border border-primary/40 text-primary cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                        >
                          ✅ Finalizar pedido
                        </motion.button>
                        <motion.button
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.18 }}
                          onClick={handleBackToMenu}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-surface-2 border border-border-subtle text-foreground-muted cursor-pointer hover:border-foreground/40 hover:text-foreground transition-colors duration-200"
                        >
                          🔙 Menu principal
                        </motion.button>
                      </div>
                    )}

                    {/* Attendant — back to menu */}
                    {msg.type === "attendant" && isLastButtonMsg && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <motion.button
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          onClick={handleBackToMenu}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-surface-2 border border-border-subtle text-foreground-muted cursor-pointer hover:border-foreground/40 hover:text-foreground transition-colors duration-200"
                        >
                          🔙 Voltar ao menu
                        </motion.button>
                      </div>
                    )}

                    {/* Finalized — new order */}
                    {msg.type === "finalized" && isLastButtonMsg && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <motion.button
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          onClick={handleNewOrder}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-primary/15 border border-primary/40 text-primary cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                        >
                          🔄 Novo pedido
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        <div className="px-3 py-2 border-t border-border-subtle flex items-center gap-2" style={{ background: "hsl(0 0% 7%)" }}>
          <div className="flex-1 h-9 rounded-full bg-surface-2 px-4 flex items-center">
            <span className="text-xs text-foreground-muted">Digite uma mensagem...</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[hsl(142,70%,45%)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-background">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

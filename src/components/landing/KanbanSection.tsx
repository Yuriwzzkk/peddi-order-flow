import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { SectionWrapper } from "./SectionWrapper";

interface OrderCard {
  id: number;
  items: string[];
  total: string;
}

const orders: OrderCard[] = [
  { id: 1, items: ["2x Smash Burguer", "1x Coca-Cola gelada"], total: "R$57,80" },
  { id: 2, items: ["1x X-Bacon", "1x Suco de Laranja", "1x Batata Frita"], total: "R$42,70" },
  { id: 3, items: ["3x Combo Kids", "2x Água"], total: "R$89,50" },
  { id: 4, items: ["1x Duplo Cheddar", "1x Milk Shake", "1x Onion Rings"], total: "R$67,90" },
  { id: 5, items: ["2x X-Burguer Clássico", "2x Guaraná"], total: "R$63,80" },
  { id: 6, items: ["1x Smash Burguer", "1x Batata Frita"], total: "R$39,80" },
  { id: 7, items: ["2x Combo Duplo", "2x Coca-Cola"], total: "R$94,60" },
  { id: 8, items: ["1x X-Burguer", "1x Suco Natural"], total: "R$34,80" },
];

const MAX_VISIBLE = 5;

export function KanbanSection() {
  const [visibleOrders, setVisibleOrders] = useState<OrderCard[]>(orders.slice(0, MAX_VISIBLE));
  const [nextIndex, setNextIndex] = useState(MAX_VISIBLE);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleOrders((prev) => {
        const newOrder = orders[nextIndex % orders.length];
        return [{ ...newOrder, id: Date.now() }, ...prev.slice(0, MAX_VISIBLE - 1)];
      });
      setNextIndex((i) => i + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [nextIndex]);

  return (
    <SectionWrapper id="como-funciona">
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-display font-bold text-foreground mb-4"
          style={{ fontSize: "clamp(2.5rem, 6vw, 3.5rem)" }}
        >
          O FoodWaker organiza tudo automaticamente
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-lg text-foreground-muted max-w-xl mx-auto"
        >
          Cada pedido aparece em tempo real, organizado e pronto para ser preparado.
        </motion.p>
      </div>

      {/* Live badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex justify-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-2 border border-border-subtle">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(142,70%,45%)] opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(142,70%,45%)]" />
          </span>
          <span className="text-xs text-foreground-muted">
            <span className="text-foreground font-medium">Ao vivo</span> · 12 pedidos hoje · R$1.240 faturados
          </span>
        </div>
      </motion.div>

      {/* Feed */}
      <div className="max-w-[480px] mx-auto flex flex-col gap-3 overflow-hidden" style={{ minHeight: 520 }}>
        <AnimatePresence initial={false}>
          {visibleOrders.map((order, i) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: -30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="rounded-[14px] border border-border-subtle overflow-hidden"
              style={{
                background: "hsl(0 0% 10%)",
                boxShadow: "0 0 0 1px hsl(0 0% 12%), 0 2px 8px -2px hsla(0,0%,0%,0.15)",
                opacity: i >= MAX_VISIBLE - 1 ? 0.5 : 1,
              }}
            >
              {/* Card header */}
              <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                <Bell className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Novo pedido</span>
                <span className="text-xs text-foreground-muted">· agora</span>
              </div>

              <div className="mx-4 border-t border-border-subtle" />

              {/* Items */}
              <div className="px-4 pt-2.5 pb-3 space-y-1">
                {order.items.map((item, idx) => (
                  <p key={idx} className="text-sm text-foreground">{item}</p>
                ))}
                <div className="flex justify-end pt-1">
                  <span className="text-base font-bold text-primary">{order.total}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 px-4 pb-3">
                <button className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-200">
                  🟠 Confirmar
                </button>
                <button className="flex-1 px-3 py-2 text-xs rounded-lg border border-border-subtle text-foreground-muted hover:border-foreground/40 hover:text-foreground transition-all duration-200">
                  Ver detalhes
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </SectionWrapper>
  );
}

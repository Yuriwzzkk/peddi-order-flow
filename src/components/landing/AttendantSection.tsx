import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { SectionWrapper } from "./SectionWrapper";
import { Smartphone, Zap, XCircle, RefreshCw, DollarSign, Star } from "lucide-react";

/* ── Products for the attendant mockup ── */
const products = [
  { name: "X-Burguer", price: 24.9 },
  { name: "Smash", price: 29.9 },
  { name: "Duplo Bacon", price: 34.9 },
  { name: "Coca", price: 7.9 },
  { name: "Suco", price: 9.9 },
  { name: "Água", price: 4.9 },
  { name: "Batata", price: 12.9 },
  { name: "Onion", price: 14.9 },
  { name: "Combo", price: 44.9 },
];

const autoClickSequence = [0, 3, 6, 1, 4]; // X-Burguer → Coca → Batata → Smash → Suco then reset

/* ── Benefits list ── */
const benefits = [
  { icon: Smartphone, title: "Interface simples para o atendente", desc: "Qualquer funcionário aprende em minutos. Sem treinamento longo." },
  { icon: Zap, title: "Pedido entra no sistema na hora", desc: "Assim que o atendente confirma, a cozinha já recebe. Sem intermediários." },
  { icon: XCircle, title: "Zero papel, zero erro de escrita", desc: "Acabou o problema de pedido ilegível ou esquecido." },
  { icon: RefreshCw, title: "Integrado com o mesmo painel", desc: "Pedidos presenciais e deliveries aparecem juntos, organizados." },
  { icon: DollarSign, title: "Upsell sugerido na tela", desc: "O sistema sugere ao atendente o que oferecer junto, aumentando o ticket." },
];

/* ── Counter hook ── */
function useAnimatedTotal(target: number, inView: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let current = 0;
    const step = target / (800 / 16);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setVal(target); clearInterval(timer); }
      else setVal(current);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return val;
}

export function AttendantSection() {
  const mockupRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(mockupRef, { once: false, amount: 0.3 });

  const [orderItems, setOrderItems] = useState<{ name: string; price: number }[]>([]);
  const [highlightedIdx, setHighlightedIdx] = useState<number | null>(null);
  const [seqStep, setSeqStep] = useState(0);

  const total = orderItems.reduce((s, i) => s + i.price, 0);
  const animatedTotal = useAnimatedTotal(total, true);

  // Auto-click simulation
  useEffect(() => {
    if (!isInView) return;

    const interval = setInterval(() => {
      const prodIdx = autoClickSequence[seqStep % autoClickSequence.length];
      const product = products[prodIdx];

      // Highlight
      setHighlightedIdx(prodIdx);
      setTimeout(() => setHighlightedIdx(null), 300);

      // Add to order
      setOrderItems((prev) => {
        if (prev.length >= 5) return [product]; // reset after 5
        return [...prev, product];
      });

      setSeqStep((s) => s + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, [isInView, seqStep]);

  return (
    <SectionWrapper id="presencial">
      {/* Title */}
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-display font-bold text-foreground mb-4"
          style={{ fontSize: "clamp(2.5rem, 6vw, 3.5rem)" }}
        >
          Chega de papel e caneta. O atendente usa só o celular.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-foreground-muted max-w-2xl mx-auto text-lg"
        >
          Para pedidos presenciais, o FoodWaker tem um sistema exclusivo: o atendente seleciona os itens direto no celular enquanto o cliente fala. O pedido já entra no sistema na hora — organizado, sem erro, sem retrabalho.
        </motion.p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left — Benefits */}
        <div className="flex flex-col gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-display font-bold text-foreground text-sm mb-1">{b.title}</h4>
                <p className="text-sm text-foreground-muted leading-relaxed">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right — Mockup */}
        <motion.div
          ref={mockupRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-primary/30 text-xs text-primary mb-4">
            <Star className="w-3 h-3" />
            Sistema exclusivo FoodWaker
          </div>

          {/* Phone frame */}
          <div
            className="w-full max-w-[340px] rounded-[28px] border-4 border-[hsl(0,0%,18%)] overflow-hidden"
            style={{
              background: "hsl(0 0% 7%)",
              boxShadow: "0 20px 50px -15px hsla(0,0%,0%,0.5), inset 0 0 0 2px hsla(0,0%,100%,0.04)",
            }}
          >
            {/* Notch */}
            <div className="flex justify-center">
              <div className="w-24 h-5 bg-background rounded-b-xl" />
            </div>

            {/* Header */}
            <div className="px-4 pt-2 pb-3 flex items-center justify-between border-b border-border-subtle">
              <div>
                <p className="text-xs font-medium text-foreground">Novo Pedido</p>
                <p className="text-[10px] text-foreground-muted">Atendente: João</p>
              </div>
              <button className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-primary text-primary-foreground">
                Finalizar pedido
              </button>
            </div>

            {/* Product grid */}
            <div className="px-3 pt-3 pb-2">
              <div className="grid grid-cols-3 gap-1.5">
                {products.map((p, idx) => (
                  <div
                    key={p.name}
                    className="relative rounded-lg p-2 border transition-all duration-300"
                    style={{
                      background: highlightedIdx === idx ? "hsl(18 100% 58% / 0.15)" : "hsl(0 0% 11%)",
                      borderColor: highlightedIdx === idx ? "hsl(18 100% 58% / 0.5)" : "hsl(0 0% 14%)",
                    }}
                  >
                    <p className="text-[10px] text-foreground font-medium truncate">{p.name}</p>
                    <p className="text-[9px] text-foreground-muted">R${p.price.toFixed(2).replace(".", ",")}</p>
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                      <span className="text-[8px] text-primary font-bold">+</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div className="mx-3 mb-3 rounded-lg border border-border-subtle p-3" style={{ background: "hsl(0 0% 8.5%)" }}>
              <p className="text-[10px] font-medium text-foreground-muted mb-2">Resumo do pedido</p>
              <div className="space-y-1 min-h-[60px]">
                {orderItems.length === 0 && (
                  <p className="text-[10px] text-foreground-muted italic">Nenhum item adicionado</p>
                )}
                {orderItems.map((item, i) => (
                  <motion.div
                    key={`${item.name}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-between text-[10px]"
                  >
                    <span className="text-foreground">1x {item.name}</span>
                    <span className="text-foreground-muted">R${item.price.toFixed(2).replace(".", ",")}</span>
                  </motion.div>
                ))}
              </div>
              <div className="border-t border-border-subtle mt-2 pt-2 flex justify-between">
                <span className="text-xs font-bold text-foreground">Total</span>
                <span className="text-xs font-bold text-primary">
                  R${animatedTotal.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Closing */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mt-16"
      >
        <p className="text-lg text-foreground font-display font-bold mb-6">
          Presencial ou delivery, tudo no mesmo lugar. Seu restaurante funcionando como uma máquina.
        </p>
        <a
          href="#cta"
          className="inline-block px-6 py-3 text-sm font-bold rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
        >
          Ver demonstração completa →
        </a>
      </motion.div>
    </SectionWrapper>
  );
}

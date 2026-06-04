import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import { SectionWrapper } from "./SectionWrapper";
import { TrendingUp, UserCheck, Zap, ShoppingCart, Users, Gift, CheckCircle, ArrowRight } from "lucide-react";

/* ── Counter animation hook ── */
function useCounter(target: number, duration = 1500, inView: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return value;
}

/* ── Mini chat simulation (auto-loop, illustrative) ── */
function MiniChat({ messages, loop = true }: { messages: { text: string; sender: "client" | "bot"; buttons?: string[] }[]; loop?: boolean }) {
  const [visible, setVisible] = useState(0);
  const [clickedBtn, setClickedBtn] = useState<string | null>(null);

  const reset = useCallback(() => {
    setVisible(0);
    setClickedBtn(null);
  }, []);

  useEffect(() => {
    if (visible >= messages.length) {
      if (loop) {
        const t = setTimeout(reset, 3000);
        return () => clearTimeout(t);
      }
      return;
    }
    const t = setTimeout(() => setVisible((v) => v + 1), visible === 0 ? 400 : 800);
    return () => clearTimeout(t);
  }, [visible, messages.length, loop, reset]);

  return (
    <div className="flex flex-col gap-2 mt-4 p-3 rounded-xl bg-background/50 border border-border-subtle">
      {messages.slice(0, visible).map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}
        >
          <div className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] ${
            msg.sender === "client"
              ? "bg-[hsl(142,70%,30%)] text-foreground rounded-br-none"
              : "bg-surface-2 text-foreground rounded-bl-none"
          }`}>
            {msg.text}
          </div>
        </motion.div>
      ))}
      {/* Buttons on last bot message */}
      {visible === messages.length && messages[messages.length - 1]?.buttons && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-1.5">
          {messages[messages.length - 1].buttons!.map((btn) => (
            <button
              key={btn}
              onClick={() => setClickedBtn(btn)}
              className={`px-2 py-1 text-[10px] rounded-md border transition-all duration-200 ${
                clickedBtn === btn
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface-2 border-primary/30 text-foreground-muted hover:border-primary hover:text-primary"
              }`}
            >
              {btn}
            </button>
          ))}
        </motion.div>
      )}
      {clickedBtn && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
          <div className="px-3 py-1.5 rounded-xl text-xs bg-surface-2 text-foreground rounded-bl-none">
            {clickedBtn === "✅ Sim, quero!" ? "Perfeito! Seu ticket subiu de R$24,90 para R$37,80 🎉" : "Tudo bem! Seu pedido está sendo preparado 🍔"}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ── Timeline Step ── */
const timelineSteps = [
  { icon: ShoppingCart, label: "Cliente escolhe item" },
  { icon: Users, label: "Sistema identifica perfil" },
  { icon: Gift, label: "Sugere complemento" },
  { icon: CheckCircle, label: "Cliente aceita" },
  { icon: TrendingUp, label: "Ticket aumenta" },
];

export function SalesBoostSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });

  const ticketCounter = useCounter(34, 1500, inView);
  const recoveredCounter = useCounter(2400, 1500, inView);

  return (
    <SectionWrapper id="upsell">
      <div ref={sectionRef}>
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
            Seu restaurante vendendo mais, no piloto automático.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-lg text-foreground-muted max-w-2xl mx-auto"
          >
            Enquanto você foca na cozinha, o FoodWaker trabalha para aumentar cada venda automaticamente.
          </motion.p>
        </div>

        {/* Grid: Upsell + Recovery */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* PART A — Upsell */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-card rounded-2xl p-7 border border-border-subtle"
            style={{ boxShadow: "0 0 0 1px hsl(0 0% 12%), 0 4px 12px -4px hsla(0,0%,0%,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-foreground text-lg">Aumento de ticket médio automático</h3>
            </div>
            <p className="text-sm text-foreground-muted leading-relaxed mb-4">
              Quando um cliente pede um hambúrguer, o FoodWaker automaticamente pergunta: "Que tal adicionar uma batata frita e uma Coca por apenas R$12 a mais?" — exatamente como faria um bom atendente.
            </p>

            <MiniChat
              messages={[
                { text: "Quero 1 X-Burguer", sender: "client" },
                { text: "Ótimo! 🍔 Que tal completar seu pedido? Adicione batata frita + Coca-Cola por só +R$12,90!", sender: "bot", buttons: ["✅ Sim, quero!", "❌ Não, obrigado"] },
              ]}
              loop={false}
            />

            <div className="mt-6 pt-4 border-t border-border-subtle">
              <span className="text-3xl font-display font-bold text-primary">+{ticketCounter}%</span>
              <p className="text-xs text-foreground-muted mt-1">no ticket médio dos restaurantes que usam upsell automático</p>
            </div>
          </motion.div>

          {/* PART B — Recovery */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-card rounded-2xl p-7 border border-border-subtle"
            style={{ boxShadow: "0 0 0 1px hsl(0 0% 12%), 0 4px 12px -4px hsla(0,0%,0%,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-foreground text-lg">Recuperação de clientes inativos</h3>
            </div>
            <p className="text-sm text-foreground-muted leading-relaxed mb-4">
              O sistema identifica clientes que não pedem há mais de 7 dias e envia uma mensagem personalizada no WhatsApp — sem você precisar fazer nada.
            </p>

            {/* Recovery simulation */}
            <div className="mt-4 p-3 rounded-xl bg-background/50 border border-border-subtle space-y-3">
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                FoodWaker enviou mensagem automática para 47 clientes inativos
              </div>
              <div className="px-3 py-2 rounded-lg bg-surface-2 border border-border-subtle">
                <p className="text-xs text-foreground">Oi João! 👋 Faz um tempo que você não nos visita. Que tal 15% OFF no seu próximo pedido? Use o código: <span className="text-primary font-bold">VOLTEI15</span></p>
              </div>
              <button className="w-full px-3 py-2 text-xs rounded-lg bg-primary/15 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200">
                🍔 Fazer pedido agora
              </button>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(142,70%,45%,0.1)] border border-[hsl(142,70%,45%,0.2)]">
                <CheckCircle className="w-3.5 h-3.5 text-[hsl(142,70%,45%)]" />
                <span className="text-xs text-[hsl(142,70%,45%)]">12 clientes retornaram · R$847 recuperados</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle">
              <span className="text-3xl font-display font-bold text-primary">R${recoveredCounter.toLocaleString("pt-BR")}</span>
              <p className="text-xs text-foreground-muted mt-1">recuperados em média por mês por restaurante</p>
            </div>
          </motion.div>
        </div>

        {/* PART C — Order Bump */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-2xl p-8 border border-border-subtle overflow-hidden"
          style={{
            background: "hsl(0 0% 9.5%)",
            borderTop: "3px solid hsl(18 100% 58%)",
            boxShadow: "0 0 0 1px hsl(0 0% 12%), 0 4px 12px -4px hsla(0,0%,0%,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-foreground text-lg">Sugestão inteligente no momento certo</h3>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed mb-8 max-w-2xl">
            Na hora de fechar o pedido, o FoodWaker sugere itens complementares de forma natural — como um atendente experiente faria. Sem ser invasivo, sem parecer robô.
          </p>

          {/* Timeline — Desktop (horizontal) */}
          <div className="relative hidden md:flex items-center justify-between gap-2 overflow-x-auto pb-4">
            <div className="absolute top-5 left-8 right-8 h-0.5 bg-border-subtle">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </div>

            {timelineSteps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
                className="relative flex flex-col items-center gap-2 min-w-[100px] z-10"
              >
                <div className="w-10 h-10 rounded-full bg-surface-2 border border-border-subtle flex items-center justify-center">
                  <step.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[11px] text-foreground-muted text-center leading-tight">{step.label}</span>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2, duration: 0.3 }}
              className="relative flex flex-col items-center gap-2 min-w-[80px] z-10"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-lg">
                🎉
              </div>
              <span className="text-[11px] text-foreground-muted text-center leading-tight">Todo mundo feliz</span>
            </motion.div>
          </div>

          {/* Timeline — Mobile (vertical cards) */}
          <div className="flex flex-col items-center gap-3 md:hidden px-4">
            {timelineSteps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="w-full"
              >
                <div className="w-full rounded-xl bg-surface-2 border border-border-subtle p-4 flex flex-col items-center gap-2">
                  <step.icon className="w-6 h-6 text-primary" />
                  <span className="text-xs text-foreground text-center leading-tight">{step.label}</span>
                </div>
                {i < timelineSteps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowRight className="w-4 h-4 text-primary rotate-90" />
                  </div>
                )}
              </motion.div>
            ))}
            {/* Final card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.3 }}
              className="w-full rounded-xl border border-primary/30 p-4 flex flex-col items-center gap-2"
              style={{ background: "#1C1C1C" }}
            >
              <span className="text-lg">🎉</span>
              <span className="text-xs text-foreground text-center leading-tight font-bold">Todo mundo feliz</span>
            </motion.div>
          </div>

          <p className="text-center text-sm text-foreground-muted mt-8 flex items-center justify-center gap-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            Tudo isso acontece automaticamente. Você configura uma vez e o Peddi trabalha enquanto você dorme.
          </p>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}

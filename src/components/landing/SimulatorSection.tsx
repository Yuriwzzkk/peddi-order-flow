import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { SectionWrapper } from "./SectionWrapper";
import { Slider } from "@/components/ui/slider";
import { ArrowRight } from "lucide-react";

/* ── Animated counter hook ── */
function useAnimatedValue(target: number, duration = 400) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>();
  const startRef = useRef({ value: target, time: 0 });

  useEffect(() => {
    const startValue = startRef.current.value;
    const startTime = performance.now();
    startRef.current = { value: startValue, time: startTime };

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        startRef.current = { value: target, time: now };
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

/* ── Result Card ── */
function ResultCard({ label, value, prefix = "", suffix = "" }: { label: string; value: number; prefix?: string; suffix?: string }) {
  const animated = useAnimatedValue(value);
  const [pulse, setPulse] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 150);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <motion.div
      animate={pulse ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.15 }}
      className="flex-1 min-w-0 rounded-xl p-4 text-center"
      style={{
        background: "hsl(0 0% 10%)",
        borderTop: "3px solid hsl(18 100% 58%)",
        border: "1px solid hsl(0 0% 16%)",
        borderTopWidth: "3px",
        borderTopColor: "hsl(18 100% 58%)",
      }}
    >
      <p className="text-xs text-foreground-muted mb-2 leading-tight">{label}</p>
      <span className="text-2xl md:text-3xl font-display font-bold text-primary">
        {prefix}{animated.toLocaleString("pt-BR")}{suffix}
      </span>
    </motion.div>
  );
}

/* ── Slider Input Row ── */
function SliderInput({
  label,
  min,
  max,
  value,
  onChange,
  prefix = "",
  suffix = "",
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm text-foreground-muted">{label}</label>
        <span className="text-lg font-bold text-primary whitespace-nowrap">
          {prefix}{value.toLocaleString("pt-BR")}{suffix}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}

/* ── Main Section ── */
export function SimulatorSection() {
  const [orders, setOrders] = useState(30);
  const [ticket, setTicket] = useState(45);
  const [days, setDays] = useState(26);

  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });

  // Calculations
  const ordersPerMonth = orders * days;
  const lostOrders = Math.round(ordersPerMonth * 0.12);
  const recovered = Math.round(lostOrders * 0.74);
  const moneyRecovered = recovered * ticket;
  const upsellGain = Math.round(ordersPerMonth * ticket * 0.08);
  const totalRecovered = moneyRecovered + upsellGain;
  const annualTotal = totalRecovered * 12;
  const animatedAnnual = useAnimatedValue(annualTotal);

  return (
    <SectionWrapper id="simulador">
      <div ref={sectionRef}>
        {/* Title */}
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-display font-bold text-foreground mb-3"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Calcule quanto seu restaurante está perdendo
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-foreground-muted text-base"
          >
            Coloque seus números e veja o impacto real.
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mx-auto max-w-[600px] rounded-2xl p-6 md:p-8 space-y-6"
          style={{
            background: "hsl(0 0% 8.5%)",
            border: "1px solid hsl(0 0% 16%)",
          }}
        >
          {/* Sliders */}
          <SliderInput
            label="Quantos pedidos você recebe por dia?"
            min={5} max={200} value={orders} onChange={setOrders}
          />
          <SliderInput
            label="Qual o valor médio de cada pedido?"
            min={20} max={200} value={ticket} onChange={setTicket}
            prefix="R$"
          />
          <SliderInput
            label="Quantos dias por mês você trabalha?"
            min={15} max={30} value={days} onChange={setDays}
          />

          {/* Divider */}
          <div className="border-t border-border-subtle" />

          {/* Results */}
          <div className="flex flex-col md:flex-row gap-3">
            <ResultCard label="Pedidos perdidos por mês" value={lostOrders} />
            <ResultCard label="Recuperados pelo Peddi" value={recovered} />
            <ResultCard label="Dinheiro extra por mês" value={totalRecovered} prefix="R$ " />
          </div>

          {/* Annual impact */}
          <p className="text-center text-sm text-foreground">
            São{" "}
            <span className="text-primary font-bold text-base">
              R$ {animatedAnnual.toLocaleString("pt-BR")}
            </span>{" "}
            por ano que você está deixando na mesa.
          </p>

          {/* CTA */}
          <div className="text-center space-y-3">
            <a
              href="#precos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:shadow-[0_0_20px_hsla(18,100%,58%,0.3)] transition-all duration-200"
            >
              Quero recuperar esse dinheiro
              <ArrowRight className="w-4 h-4" />
            </a>
            <p className="text-xs text-foreground-muted/60">
              Estimativa baseada na média dos restaurantes que usam o Peddi.
            </p>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}

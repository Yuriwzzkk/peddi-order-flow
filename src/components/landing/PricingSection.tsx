import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { SectionWrapper } from "./SectionWrapper";
import { Check } from "lucide-react";

const starterFeatures = [
  "Cardápio automático no WhatsApp",
  "Até 300 pedidos/mês",
  "Painel de pedidos em tempo real",
  "Alertas instantâneos",
  "Suporte por chat",
];

const proFeatures = [
  "Tudo do Starter",
  "Pedidos ilimitados",
  "Upsell e recuperação automática",
  "Atendimento presencial (modo atendente)",
  "Relatórios e métricas avançadas",
  "Múltiplos atendentes",
  "Suporte prioritário via WhatsApp",
];

export function PricingSection() {
  return (
    <SectionWrapper id="precos">
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-display font-bold text-foreground mb-4"
          style={{ fontSize: "clamp(2.5rem, 6vw, 3.5rem)" }}
        >
          Simples, transparente, sem surpresas.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-foreground-muted max-w-2xl mx-auto text-lg"
        >
          Escolha o plano e comece hoje mesmo. Cancele quando quiser.
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
        {/* Starter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="rounded-2xl border border-border-subtle p-8 flex flex-col"
          style={{ background: "hsl(0 0% 8.5%)" }}
        >
          <span className="inline-block text-xs font-medium text-foreground-muted bg-surface-2 border border-border-subtle px-3 py-1 rounded-full w-fit mb-6">
            Ideal para começar
          </span>
          <div className="mb-1">
            <span className="text-4xl font-display font-bold text-foreground">R$97</span>
            <span className="text-foreground-muted text-sm">/mês</span>
          </div>
          <p className="text-xs text-foreground-muted mb-8">ou R$970/ano — 2 meses grátis</p>

          <ul className="flex flex-col gap-3 mb-8 flex-1">
            {starterFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <a
            href="/checkout?plan=starter"
            className="block text-center px-6 py-3 text-sm font-bold rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          >
            Começar agora
          </a>
        </motion.div>

        {/* Pro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-2xl border-2 border-primary p-8 flex flex-col relative"
          style={{ background: "hsl(0 0% 8.5%)" }}
        >
          <span className="inline-block text-xs font-bold text-primary-foreground bg-primary px-3 py-1 rounded-full w-fit mb-6">
            ⭐ Mais popular
          </span>
          <div className="mb-1">
            <span className="text-4xl font-display font-bold text-primary">R$197</span>
            <span className="text-foreground-muted text-sm">/mês</span>
          </div>
          <p className="text-xs text-foreground-muted mb-8">ou R$1.970/ano — 2 meses grátis</p>

          <ul className="flex flex-col gap-3 mb-8 flex-1">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <a
            href="/checkout?plan=pro"
            className="block text-center px-6 py-3 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-[0_0_24px_hsla(18,100%,58%,0.4)] transition-all duration-200"
          >
            Começar agora
          </a>
          <p className="text-center text-xs text-foreground-muted mt-3">Pagamento via PIX · 3 dias grátis após configurar</p>
        </motion.div>
      </div>

      {/* Bottom note */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center text-sm text-foreground-muted mt-10"
      >
        Todos os planos incluem 3 dias de teste gratuito. Dúvidas?{" "}
        <a href="#cta" className="text-primary hover:underline">
          Falar com suporte →
        </a>
      </motion.p>
    </SectionWrapper>
  );
}

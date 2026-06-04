import { motion } from "framer-motion";

export function CTASection() {
  return (
    <motion.section
      id="cta"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="relative z-10 bg-primary py-24 lg:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-6 lg:px-16 text-center">
        <p className="text-sm font-medium text-primary-foreground/70 tracking-widest uppercase mb-6">
          Sem cartão de crédito · Sem compromisso
        </p>

        <h2
          className="font-display font-bold text-primary-foreground mb-6"
          style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)" }}
        >
          Teste o FoodWaker por 3 dias grátis.
        </h2>

        <p className="text-lg text-primary-foreground/70 mb-10 max-w-xl mx-auto">
          Configure em menos de 5 minutos e comece a receber pedidos hoje mesmo.
        </p>

        <a
          href="/checkout?plan=pro"
          className="inline-block px-10 py-5 text-lg font-bold rounded-xl bg-background text-foreground hover:bg-foreground hover:text-background active:scale-[0.97] transition-all duration-150"
        >
          COMEÇAR AGORA →
        </a>

        <p className="text-sm text-primary-foreground/50 mt-8">
          🔒 Dados seguros · Cancele quando quiser · Suporte em português
        </p>
      </div>
    </motion.section>
  );
}

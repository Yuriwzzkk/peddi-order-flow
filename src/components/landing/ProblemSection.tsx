import { motion } from "framer-motion";
import { SectionWrapper } from "./SectionWrapper";
import { FileX, Clock, Frown } from "lucide-react";

const problems = [
  {
    icon: FileX,
    title: "Pedidos perdidos",
    text: "Anotações em papel se perdem, e pedidos no WhatsApp ficam esquecidos.",
    stat: "37%",
    statLabel: "dos pedidos sem sistema são esquecidos ou errados",
  },
  {
    icon: Clock,
    title: "Tempo desperdiçado",
    text: "Copiar e colar, anotar manualmente e conferir tudo consome horas do dia.",
    stat: "4h",
    statLabel: "por dia perdidas com gestão manual",
  },
  {
    icon: Frown,
    title: "Clientes insatisfeitos",
    text: "Um único erro pode gerar uma avaliação negativa permanente.",
    stat: "1 erro",
    statLabel: "= avaliação negativa permanente",
  },
];

export function ProblemSection() {
  return (
    <SectionWrapper id="problema">
      <div className="text-center mb-16">
        <h2 className="font-display font-bold text-foreground mb-4" style={{ fontSize: "clamp(2.5rem, 6vw, 3.5rem)" }}>
          Você ainda gerencia pedidos assim?
        </h2>
        <p className="text-foreground-muted max-w-2xl mx-auto text-lg">
          Anotações em papel, confusão no WhatsApp, pedidos perdidos. Isso custa dinheiro e clientes.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {problems.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="group relative bg-card rounded-2xl p-7 border border-border-subtle hover:-translate-y-1.5 transition-all duration-200 overflow-hidden"
            style={{
              boxShadow: "0 0 0 1px hsl(0 0% 12%), 0 4px 8px -2px hsla(0,0%,0%,0.1), 0 10px 20px -5px hsla(0,0%,0%,0.1)",
            }}
          >
            {/* Top border accent on hover */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <p.icon className="w-8 h-8 text-foreground mb-4" strokeWidth={1.5} />
            <h3 className="font-display font-bold text-foreground text-lg mb-2">{p.title}</h3>
            <p className="text-sm text-foreground-muted mb-6">{p.text}</p>
            <div>
              <span className="text-3xl font-display font-bold text-primary">{p.stat}</span>
              <p className="text-xs text-foreground-muted mt-1">{p.statLabel}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

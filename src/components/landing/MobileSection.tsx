import { motion } from "framer-motion";
import { SectionWrapper } from "./SectionWrapper";
import { Check } from "lucide-react";

const benefits = [
  "Funciona em qualquer navegador mobile",
  "Notificações push em tempo real",
  "Interface responsiva e rápida",
  "Sem instalação de app",
];

export function MobileSection() {
  return (
    <SectionWrapper>
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Text */}
        <div>
          <h2 className="font-display font-bold text-foreground mb-4" style={{ fontSize: "clamp(2.5rem, 6vw, 3.5rem)" }}>
            Gerencie tudo pelo celular
          </h2>
          <p className="text-lg text-foreground-muted mb-8">
            Acesse o painel do Peddi de qualquer lugar, a qualquer hora.
          </p>
          <ul className="flex flex-col gap-4">
            {benefits.map((b, i) => (
              <motion.li
                key={b}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </span>
                <span className="text-foreground">{b}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Phone mockup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <div className="relative">
            {/* Orange glow */}
            <div className="absolute inset-0 -m-12 rounded-[60px] bg-[radial-gradient(circle,hsla(18,100%,58%,0.12)_0%,transparent_70%)] pointer-events-none" />

            <div
              className="animate-float-slow relative w-[280px] h-[560px] rounded-[40px] border-4 border-[hsl(0,0%,18%)] overflow-hidden"
              style={{
                background: "hsl(0 0% 7%)",
                boxShadow: "0 25px 60px -15px hsla(0,0%,0%,0.6), inset 0 0 0 2px hsla(0,0%,100%,0.05)",
              }}
            >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-background rounded-b-2xl z-10" />

              {/* Screen content */}
              <div className="h-full pt-8 px-4 pb-4 overflow-hidden">
                {/* Status bar */}
                <div className="flex justify-between text-[10px] text-foreground-muted mb-4 px-1">
                  <span>9:41</span>
                  <div className="flex gap-1">
                    <span>📶</span><span>🔋</span>
                  </div>
                </div>

                {/* Mini dashboard */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">P</div>
                    <span className="text-xs font-bold text-foreground">Peddi Dashboard</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Pedidos hoje", value: "47" },
                      { label: "Faturamento", value: "R$2.1k" },
                      { label: "Em preparo", value: "8" },
                      { label: "Entregues", value: "39" },
                    ].map((s) => (
                      <div key={s.label} className="p-2.5 rounded-lg bg-surface-2 border border-border-subtle">
                        <p className="text-[9px] text-foreground-muted">{s.label}</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent orders */}
                  <p className="text-[10px] font-medium text-foreground-muted mt-3">Pedidos recentes</p>
                  {[
                    { name: "João S. · X-Burguer + Coca", status: "Preparando", color: "text-kanban-prep" },
                    { name: "Maria L. · Combo Smash + Batata", status: "Pronto ✅", color: "text-kanban-ready" },
                    { name: "Carlos M. · Duplo Bacon + Suco", status: "Enviado 🛵", color: "text-kanban-delivery" },
                  ].map((o) => (
                    <div key={o.name} className="flex items-center justify-between p-2 rounded-lg bg-surface-2 border border-border-subtle">
                      <span className="text-[10px] text-foreground">{o.name}</span>
                      <span className={`text-[9px] font-medium ${o.color}`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}

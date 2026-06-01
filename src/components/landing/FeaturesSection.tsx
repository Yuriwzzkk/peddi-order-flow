import { motion } from "framer-motion";
import { SectionWrapper } from "./SectionWrapper";
import { Bot, ClipboardList, MessageCircle, BarChart3, Bell, Truck } from "lucide-react";

const features = [
  { icon: Bot, title: "Cardápio automático no WhatsApp", desc: "Cliente recebe menu interativo sem precisar de atendente." },
  { icon: ClipboardList, title: "Painel de pedidos em tempo real", desc: "Visualize e organize todos os pedidos em um único lugar." },
  { icon: MessageCircle, title: "Atendimento humanizado", desc: "Quando necessário, assuma o chat com 1 clique." },
  { icon: BarChart3, title: "Relatórios e métricas", desc: "Veja quais itens vendem mais, horários de pico e faturamento." },
  { icon: Bell, title: "Alertas instantâneos", desc: "Notificações sonoras e visuais para cada novo pedido." },
  { icon: Truck, title: "Gestão de entregas", desc: "Acompanhe o status de cada delivery em tempo real." },
];

export function FeaturesSection() {
  return (
    <SectionWrapper id="funcionalidades">
      <div className="text-center mb-16">
        <h2 className="font-display font-bold text-foreground mb-4" style={{ fontSize: "clamp(2.5rem, 6vw, 3.5rem)" }}>
          Tudo que seu restaurante precisa
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="group relative bg-card rounded-2xl p-7 border border-border-subtle hover:-translate-y-2 transition-all duration-200 overflow-hidden"
            style={{
              boxShadow: "0 0 0 1px hsl(0 0% 12%), 0 4px 8px -2px hsla(0,0%,0%,0.1), 0 10px 20px -5px hsla(0,0%,0%,0.1)",
            }}
          >
            <div className="absolute inset-0 rounded-2xl border border-primary/0 group-hover:border-primary/30 transition-all duration-200 pointer-events-none" />
            <f.icon className="w-8 h-8 text-foreground group-hover:text-primary transition-colors duration-200 mb-5" strokeWidth={1.5} />
            <h3 className="font-display font-bold text-foreground text-lg mb-2">{f.title}</h3>
            <p className="text-sm text-foreground-muted leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

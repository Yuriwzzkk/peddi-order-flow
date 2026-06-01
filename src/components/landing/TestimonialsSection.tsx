import { motion } from "framer-motion";
import { SectionWrapper } from "./SectionWrapper";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Carlos M.",
    role: "Proprietário",
    restaurant: "Burger House SP",
    avatar: "https://i.pravatar.cc/80?img=11",
    text: "Antes eu perdia pedido toda semana. Hoje meu restaurante fatura 40% mais e eu trabalho tranquilo.",
  },
  {
    name: "Juliana T.",
    role: "Gerente",
    restaurant: "La Pizza Bela Horizonte",
    avatar: "https://i.pravatar.cc/80?img=5",
    text: "Meus clientes adoraram o cardápio no WhatsApp. Parece mágica.",
  },
  {
    name: "Rafael S.",
    role: "Fundador",
    restaurant: "Sushi Mania Curitiba",
    avatar: "https://i.pravatar.cc/80?img=53",
    text: "Implementei em 1 dia. Simples, rápido e transformou meu negócio.",
  },
];

export function TestimonialsSection() {
  return (
    <SectionWrapper>
      <div className="text-center mb-16">
        <h2 className="font-display font-bold text-foreground mb-4" style={{ fontSize: "clamp(2.5rem, 6vw, 3.5rem)" }}>
          Quem usa, não abre mão
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="group bg-card rounded-2xl p-7 border border-border-subtle hover:-translate-y-1 transition-all duration-200"
            style={{
              boxShadow: "0 0 0 1px hsl(0 0% 12%), 0 4px 8px -2px hsla(0,0%,0%,0.1)",
            }}
          >
            {/* Stars */}
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: 5 }).map((_, si) => (
                <Star key={si} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>

            <p className="text-sm text-foreground-muted italic leading-relaxed mb-6">"{t.text}"</p>

            <div className="flex items-center gap-3">
              <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-foreground-muted">{t.role}, {t.restaurant}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

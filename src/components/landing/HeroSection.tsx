import { motion } from "framer-motion";
import { WhatsAppMockup } from "./WhatsAppMockup";

const avatars = [
  "https://i.pravatar.cc/80?img=12",
  "https://i.pravatar.cc/80?img=25",
  "https://i.pravatar.cc/80?img=32",
  "https://i.pravatar.cc/80?img=44",
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      <div className="background-glow" />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 lg:px-16 w-full py-20 lg:py-0">
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 lg:gap-8 items-center">
          {/* Left column */}
          <div className="flex flex-col gap-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-2 border border-primary/30 text-xs text-primary">
                <span>✦</span> Novo · Sistema completo para restaurantes
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(3.25rem, 8vw, 5rem)", textWrap: "balance" }}
            >
              Automatize os pedidos{" "}
              <br className="hidden sm:block" />
              do seu restaurante{" "}
              <br className="hidden sm:block" />
              no{" "}
              <span className="relative inline-block">
                WhatsApp
                <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-primary rounded-full" />
              </span>
              .
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-lg text-foreground-muted max-w-xl"
              style={{ textWrap: "pretty" }}
            >
              Transforme o WhatsApp em um sistema completo de pedidos, clientes e organização — sem apps extras.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <a
                href="/onboarding"
                className="px-8 py-4 text-base font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-[0_0_24px_hsla(18,100%,58%,0.5)] active:scale-[0.97] transition-all duration-150"
              >
                Testar 3 dias grátis →
              </a>
              <a
                href="#"
                className="px-8 py-4 text-base rounded-lg border border-foreground/20 text-foreground-muted hover:border-foreground/60 hover:text-foreground transition-all duration-200"
              >
                Entrar
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="flex -space-x-2">
                {avatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Usuário"
                    className="w-8 h-8 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              <p className="text-sm text-foreground-muted">
                <span className="text-foreground font-medium">+1.200 restaurantes</span> já usam o Peddi
              </p>
            </motion.div>
          </div>

          {/* Right column */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex justify-center lg:justify-end"
          >
            <WhatsAppMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

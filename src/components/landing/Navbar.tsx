import { motion } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import peddiLogo from "@/assets/peddi-logo.png";

const navLinks = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Preços", href: "#precos" },
  { label: "Blog", href: "#blog" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle"
      style={{ background: "hsla(0,0%,6%,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div className="mx-auto max-w-[1200px] px-6 lg:px-16 flex items-center justify-between h-16">
        {/* Logo — orange tint via CSS filter */}
        <a href="#" className="flex items-center">
          <img
            src={peddiLogo}
            alt="Peddi"
            style={{
              height: "64px",
              width: "auto",
              objectFit: "contain",
              objectPosition: "left center",
              transform: "scale(1.5)",
              transformOrigin: "left center",
              filter: "brightness(0) saturate(100%) invert(45%) sepia(96%) saturate(1500%) hue-rotate(346deg) brightness(101%) contrast(101%)",
            }}
          />
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-foreground-muted hover:text-foreground transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#"
            className="px-5 py-2 text-sm rounded-lg border border-foreground/20 text-foreground-muted hover:border-foreground/60 hover:text-foreground transition-all duration-200"
          >
            Entrar
          </a>
          <a
            href="/onboarding"
            className="px-5 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-[0_0_24px_hsla(18,100%,58%,0.5)] active:scale-[0.97] transition-all duration-150"
          >
            Testar grátis
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t border-border-subtle px-6 pb-6 pt-4 flex flex-col gap-4"
          style={{ background: "hsla(0,0%,6%,0.95)" }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <a href="#" className="px-5 py-2 text-sm rounded-lg border border-foreground/20 text-foreground-muted">
              Entrar
            </a>
            <a href="/onboarding" className="px-5 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground">
              Testar grátis
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

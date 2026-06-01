import { Instagram, Linkedin, MessageCircle } from "lucide-react";
import peddiLogo from "@/assets/peddi-logo.png";

const footerColumns = [
  {
    title: "Produto",
    links: ["Funcionalidades", "Preços", "Changelog", "Roadmap"],
  },
  {
    title: "Empresa",
    links: ["Sobre nós", "Blog", "Carreiras", "Imprensa"],
  },
  {
    title: "Suporte",
    links: ["Central de ajuda", "Documentação", "Status", "Contato"],
  },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border-subtle" style={{ background: "hsl(0 0% 3%)" }}>
      <div className="mx-auto max-w-[1200px] px-6 lg:px-16 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <img src={peddiLogo} alt="Peddi" style={{ height: "48px", width: "auto", objectFit: "contain", objectPosition: "left center", filter: "brightness(0) invert(1)", transform: "scale(1.5)", transformOrigin: "left center" }} />
            </div>
            <p className="text-sm text-foreground-muted mb-6">
              O sistema de pedidos por WhatsApp para restaurantes que faturam mais.
            </p>
            <div className="flex gap-3">
              {[Instagram, Linkedin, MessageCircle].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center text-foreground-muted hover:text-foreground hover:border-border-hover transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-medium text-foreground mb-4">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-foreground-muted hover:text-foreground transition-colors duration-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border-subtle mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-foreground-muted">© 2026 Peddi. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-foreground-muted hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="text-xs text-foreground-muted hover:text-foreground transition-colors">Termos</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

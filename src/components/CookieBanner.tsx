import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "peddi_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostrar banner apenas se ainda não aceitou
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      // Delay para não atrapalhar LCP
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = (analytics: boolean) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ essential: true, analytics, accepted_at: new Date().toISOString() })
    );
    setVisible(false);
    // Disparar evento customizado para Google Analytics ou outros
    window.dispatchEvent(
      new CustomEvent("cookie-consent", { detail: { analytics } })
    );
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 animate-in slide-in-from-bottom-4">
      <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Cookie size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground mb-1">
              Usamos cookies essenciais
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Utilizamos cookies para autenticação, sessão e analytics. Ao continuar,
              você concorda com nossa{" "}
              <Link to="/privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => accept(true)}
                className="h-8 text-xs bg-primary hover:bg-primary/90"
              >
                Aceitar tudo
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => accept(false)}
                className="h-8 text-xs border-zinc-700"
              >
                Apenas essenciais
              </Button>
            </div>
          </div>
          <button
            onClick={() => accept(false)}
            className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 shrink-0"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

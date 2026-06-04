// Página exibida quando o cliente acessa um domínio não configurado
import { Link } from "react-router-dom";
import { Globe, AlertTriangle, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/useTenant";

export default function DomainNotConfigured() {
  const { hostname, isCustomDomain } = useTenant();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
          <Globe size={36} className="text-amber-500" />
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Domínio não configurado
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Este endereço ainda não está vinculado a nenhum restaurante.
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-foreground font-medium">Domínio acessado:</p>
              <p className="text-muted-foreground font-mono text-xs">{hostname}</p>
            </div>
          </div>
          {isCustomDomain && (
            <p className="text-xs text-muted-foreground pl-6">
              Você acessou um domínio personalizado. Verifique se a URL está correta
              ou se o DNS já foi configurado pelo seu provedor.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-foreground font-medium">Como resolver:</p>
          <ol className="text-left text-sm text-muted-foreground space-y-2 max-w-md mx-auto">
            <li className="flex gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>Verifique se você digitou a URL corretamente</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>Se for um subdomínio <code className="text-xs bg-zinc-800 px-1 rounded">slug.foodwaker.app</code>, aguarde a configuração (até 24h após pagamento)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>Se for domínio próprio, configure o CNAME para <code className="text-xs bg-zinc-800 px-1 rounded">foodwaker.app</code></span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">4.</span>
              <span>Entre em contato com o suporte se o problema persistir</span>
            </li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button asChild variant="outline" className="flex-1">
            <a href="mailto:suporte@peddi.com.br">
              <Mail size={14} className="mr-2" /> Falar com suporte
            </a>
          </Button>
          <Button asChild className="flex-1">
            <Link to="/">
              Voltar ao site principal <ArrowRight size={14} className="ml-2" />
            </Link>
          </Button>
        </div>

        <p className="text-[10px] text-zinc-600 pt-4">
          Peddi — Plataforma de vendas no WhatsApp
        </p>
      </div>
    </div>
  );
}

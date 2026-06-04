import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-zinc-950 text-foreground py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/">
            <ArrowLeft size={16} className="mr-2" /> Voltar
          </Link>
        </Button>

        <h1 className="font-display text-4xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1. Compromisso com a LGPD
            </h2>
            <p>
              Esta política está em conformidade com a Lei Geral de Proteção de Dados
              (Lei nº 13.709/2018). Respeitamos sua privacidade e nos comprometemos a
              proteger seus dados pessoais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2. Dados que Coletamos
            </h2>
            <p>Coletamos os seguintes dados pessoais:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Cadastro:</strong> nome, email, telefone, CPF</li>
              <li><strong>Uso:</strong> cardápio, pedidos, conversas com clientes</li>
              <li><strong>Técnicos:</strong> IP, navegador, dispositivo, logs de acesso</li>
              <li><strong>Pagamento:</strong> processado por gateway externo (SyncPay) — não armazenamos dados de cartão</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3. Finalidades de Uso
            </h2>
            <p>Usamos seus dados para:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Fornecer e operar a plataforma</li>
              <li>Processar pagamentos</li>
              <li>Enviar comunicações do serviço (novidades, alertas)</li>
              <li>Cumprir obrigações legais e fiscais</li>
              <li>Melhorar a plataforma (analytics agregados e anônimos)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4. Compartilhamento
            </h2>
            <p>Compartilhamos dados apenas com:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Provedores de serviço:</strong> Supabase (banco), SyncPay (pagamento), Resend (emails)</li>
              <li><strong>Autoridades:</strong> quando exigido por lei</li>
              <li><strong>Nunca vendemos</strong> seus dados para terceiros</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              5. Cookies
            </h2>
            <p>
              Usamos cookies essenciais para autenticação e sessão. Cookies de analytics
              (Google Analytics) só são ativados com seu consentimento. Você pode gerenciar
              suas preferências no banner de cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              6. Seus Direitos (LGPD)
            </h2>
            <p>Você tem direito a:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Confirmação da existência de tratamento</li>
              <li>Acesso aos seus dados</li>
              <li>Correção de dados incompletos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação</li>
              <li>Portabilidade</li>
              <li>Revogação do consentimento</li>
            </ul>
            <p className="mt-2">
              Para exercer seus direitos, envie solicitação a{" "}
              <a href="mailto:dpo@peddi.com.br" className="text-primary hover:underline">
                dpo@peddi.com.br
              </a>
              . Responderemos em até 15 dias.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              7. Segurança
            </h2>
            <p>
              Implementamos medidas técnicas e organizacionais para proteger seus dados:
              criptografia em trânsito (HTTPS/TLS), criptografia em repouso, controle de
              acesso por função (RLS no banco), autenticação forte, e monitoramento contínuo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              8. Retenção de Dados
            </h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento,
              mantemos por 5 anos (prazo legal) e depois deletamos definitivamente. Você
              pode solicitar exclusão antecipada via DPO, exceto quando houver obrigação
              legal de retenção.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              9. Encarregado de Dados (DPO)
            </h2>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:dpo@peddi.com.br" className="text-primary hover:underline">
                dpo@peddi.com.br
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              10. Alterações nesta Política
            </h2>
            <p>
              Podemos atualizar esta política. Alterações significativas serão comunicadas
              com 30 dias de antecedência por email e banner no app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Termos() {
  return (
    <div className="min-h-screen bg-zinc-950 text-foreground py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/">
            <ArrowLeft size={16} className="mr-2" /> Voltar
          </Link>
        </Button>

        <h1 className="font-display text-4xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Aceitação</h2>
            <p>
              Ao utilizar a plataforma FoodWaker ("plataforma"), você concorda com estes Termos de Uso
              e com a nossa <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
              Se você não concordar, não utilize a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Descrição do Serviço</h2>
            <p>
              O FoodWaker é uma plataforma SaaS (Software as a Service) que permite a restaurantes
              e food service gerenciar pedidos via WhatsApp, com automações, integração com
              N8n, Z-API, e dashboards de gestão. O serviço é oferecido mediante assinatura
              mensal nos planos <strong>Starter</strong> (R$ 97/mês) e <strong>Pro</strong> (R$ 197/mês).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Cadastro e Responsabilidades</h2>
            <p>
              Para utilizar a plataforma, você deve fornecer informações verdadeiras, precisas
              e completas. Você é responsável por manter a confidencialidade da sua senha e por
              todas as atividades que ocorram na sua conta. O FoodWaker não se responsabiliza por
              danos decorrentes de uso não autorizado da sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Pagamento e Cancelamento</h2>
            <p>
              O pagamento é processado via PIX através do gateway SyncPay. A assinatura é
              renovada mensalmente mediante novo pagamento. Você pode cancelar a qualquer
              momento, sem multas, e o acesso permanece ativo até o fim do ciclo pago.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Uso Aceitável</h2>
            <p>Você concorda em NÃO:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Usar a plataforma para atividades ilegais</li>
              <li>Enviar spam, phishing ou conteúdo malicioso via WhatsApp</li>
              <li>Tentar acessar contas de outros usuários</li>
              <li>Fazer engenharia reversa ou tentar copiar a plataforma</li>
              <li>Sobrecarregar os servidores (ataques de negação de serviço)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Propriedade Intelectual</h2>
            <p>
              A plataforma, seu código, design, marca e conteúdo são de propriedade do FoodWaker
              ou licenciados a ele. Você mantém a propriedade dos dados do seu restaurante
              (cardápio, pedidos, clientes) e pode exportá-los a qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Limitação de Responsabilidade</h2>
            <p>
              O FoodWaker se esforça para manter a plataforma disponível 99% do tempo, mas não
              garante operação ininterrupta. Não nos responsabilizamos por perdas decorrentes
              de falhas técnicas, caso fortuito ou força maior. Nossa responsabilidade máxima
              é limitada ao valor pago por você nos últimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Suspensão e Encerramento</h2>
            <p>
              Podemos suspender ou encerrar contas que violem estes termos, com aviso prévio
              de 7 dias. Você pode encerrar sua conta a qualquer momento pelo painel ou
              solicitando ao suporte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Alterações nos Termos</h2>
            <p>
              Podemos atualizar estes termos. Alterações significativas serão comunicadas
              com 30 dias de antecedência por email. O uso continuado após o aviso implica
              aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Foro</h2>
            <p>
              Estes termos são regidos pelas leis da República Federativa do Brasil. Fica
              eleito o foro de São Paulo/SP para dirimir quaisquer questões.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Contato</h2>
            <p>
              Dúvidas? Entre em contato:{" "}
              <a href="mailto:suporte@peddi.com.br" className="text-primary hover:underline">
                suporte@peddi.com.br
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Pause, X, AlertTriangle, CheckCircle2, Calendar, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface Subscription {
  id: string;
  restaurant_id: string;
  plan: string;
  status: string;
  amount: number;
  started_at: string;
  current_period_end: string | null;
  cancelled_at: string | null;
  paused_at: string | null;
}

interface Payment {
  id: string;
  amount: number;
  plan: string;
  status: string;
  created_at: string;
}

export default function AdminBilling() {
  const { profile } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<"pause" | "cancel" | "resume" | null>(null);

  useEffect(() => {
    if (!profile?.restaurant_id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        // Sub atual
        const { data: subData, error: subErr } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("restaurant_id", profile.restaurant_id)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (subErr) throw subErr;
        if (subData) setSub(subData as Subscription);

        // Histórico de payments
        const { data: payData, error: payErr } = await supabase
          .from("payment_intents")
          .select("id, amount, plan, status, created_at")
          .eq("restaurant_id", profile.restaurant_id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (payErr) throw payErr;
        if (payData) setPayments(payData as Payment[]);
      } catch (e) {
        console.error("Erro billing:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.restaurant_id]);

  const handleAction = async (action: "pause" | "cancel" | "resume") => {
    if (!sub) return;
    try {
      const updates: any = { status: action === "resume" ? "active" : action === "pause" ? "paused" : "cancelled" };
      if (action === "pause") updates.paused_at = new Date().toISOString();
      if (action === "cancel") updates.cancelled_at = new Date().toISOString();

      const { error } = await supabase
        .from("subscriptions")
        .update(updates)
        .eq("id", sub.id);

      if (error) throw error;

      setSub({ ...sub, ...updates });
      setConfirmAction(null);
      toast.success(
        action === "pause" ? "Assinatura pausada. Você pode reativar quando quiser." :
        action === "cancel" ? "Assinatura cancelada. Sentiremos sua falta!" :
        "Assinatura reativada! Bem-vindo de volta."
      );
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  };

  const formatBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const daysUntilRenewal = sub?.current_period_end
    ? Math.ceil((new Date(sub.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  if (loading) {
    return <div className="text-center text-muted-foreground py-12 text-sm">Carregando...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold">Assinatura e Cobrança</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie seu plano e veja o histórico de pagamentos
        </p>
      </div>

      {!sub ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Você ainda não tem uma assinatura ativa</p>
            <p className="text-xs text-muted-foreground mt-1">
              Escolha um plano em <a href="/checkout?plan=starter" className="text-primary hover:underline">/checkout</a>
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Status card */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={sub.status === "active" ? "default" : sub.status === "paused" ? "secondary" : "destructive"}
                        className={
                          sub.status === "active" ? "bg-green-500/15 text-green-400" :
                          sub.status === "paused" ? "bg-yellow-500/15 text-yellow-400" : ""
                        }
                      >
                        {sub.status === "active" && "● "}
                        {sub.status === "active" ? "Ativa" : sub.status === "paused" ? "Pausada" : "Cancelada"}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{sub.plan}</Badge>
                    </div>
                    <p className="text-2xl font-bold">{formatBRL(sub.amount)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                    {sub.status === "active" && daysUntilRenewal !== null && daysUntilRenewal > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar size={10} /> Renova em {daysUntilRenewal} {daysUntilRenewal === 1 ? "dia" : "dias"} ({formatDate(sub.current_period_end)})
                      </p>
                    )}
                    {sub.status === "cancelled" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Cancelada em {formatDate(sub.cancelled_at)}
                      </p>
                    )}
                    {sub.status === "paused" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Pausada em {formatDate(sub.paused_at)}. Você ainda tem acesso até o fim do ciclo.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {sub.status === "active" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmAction("pause")}
                          className="text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10"
                        >
                          <Pause size={14} className="mr-1" /> Pausar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmAction("cancel")}
                          className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                        >
                          <X size={14} className="mr-1" /> Cancelar
                        </Button>
                      </>
                    )}
                    {sub.status === "paused" && (
                      <Button
                        size="sm"
                        onClick={() => setConfirmAction("resume")}
                        className="bg-primary hover:brightness-110"
                      >
                        <CheckCircle2 size={14} className="mr-1" /> Reativar
                      </Button>
                    )}
                    {sub.status === "cancelled" && (
                      <Button
                        size="sm"
                        onClick={() => setConfirmAction("resume")}
                        className="bg-primary hover:brightness-110"
                      >
                        <CheckCircle2 size={14} className="mr-1" /> Reativar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* O que está incluído */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">O que está incluído no plano {sub.plan}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {(sub.plan === "pro" ? [
                  "Pedidos ilimitados",
                  "Atendentes ilimitados",
                  "White label completo (domínio + cores + logo)",
                  "Relatórios avançados",
                  "Integração n8n",
                  "Suporte prioritário",
                ] : [
                  "Até 200 pedidos/mês",
                  "1 atendente + 1 entregador",
                  "Cardápio digital",
                  "Painel de pedidos",
                  "Suporte por email",
                ]).map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Histórico de pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Receipt size={14} /> Histórico de pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento ainda</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b">
                        <th className="pb-2 font-medium">Data</th>
                        <th className="pb-2 font-medium">Plano</th>
                        <th className="pb-2 font-medium">Valor</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="py-3 text-xs">{formatDate(p.created_at)}</td>
                          <td className="py-3"><Badge variant="outline" className="capitalize">{p.plan}</Badge></td>
                          <td className="py-3 font-medium">{formatBRL(Number(p.amount))}</td>
                          <td className="py-3">
                            <Badge
                              variant={p.status === "paid" ? "default" : "secondary"}
                              className={p.status === "paid" ? "bg-green-500/15 text-green-400" : ""}
                            >
                              {p.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal de confirmação */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              {confirmAction === "cancel" ? (
                <AlertTriangle size={24} className="text-red-500" />
              ) : confirmAction === "pause" ? (
                <Pause size={24} className="text-yellow-500" />
              ) : (
                <CheckCircle2 size={24} className="text-green-500" />
              )}
              <h2 className="text-lg font-bold">
                {confirmAction === "pause" && "Pausar assinatura?"}
                {confirmAction === "cancel" && "Cancelar assinatura?"}
                {confirmAction === "resume" && "Reativar assinatura?"}
              </h2>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              {confirmAction === "pause" && "Sua assinatura será pausada. Você ainda tem acesso até o fim do ciclo atual, mas não será cobrado no próximo. Pode reativar quando quiser."}
              {confirmAction === "cancel" && "Sua assinatura será cancelada imediatamente. Você perderá acesso aos recursos do plano ao fim do ciclo. Esta ação pode ser revertida."}
              {confirmAction === "resume" && "Sua assinatura será reativada. A próxima cobrança seguirá o ciclo original."}
            </p>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>
                Voltar
              </Button>
              <Button
                onClick={() => handleAction(confirmAction)}
                className={
                  confirmAction === "cancel" ? "bg-red-500 hover:bg-red-600 text-white" :
                  confirmAction === "pause" ? "bg-yellow-500 hover:bg-yellow-600 text-black" :
                  "bg-primary hover:brightness-110"
                }
              >
                {confirmAction === "pause" && "Sim, pausar"}
                {confirmAction === "cancel" && "Sim, cancelar"}
                {confirmAction === "resume" && "Sim, reativar"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

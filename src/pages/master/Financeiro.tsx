import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Users, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface MrrData {
  mrr: number;
  arr: number;
  active_customers: number;
  total_customers: number;
  starter_count: number;
  pro_count: number;
  starter_revenue: number;
  pro_revenue: number;
}

interface Subscription {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_slug: string;
  plan: string;
  status: string;
  amount: number;
  started_at: string;
  current_period_end: string | null;
  cancelled_at: string | null;
}

export default function MasterFinanceiro() {
  const [mrr, setMrr] = useState<MrrData | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // MRR
        const { data: mrrData } = await supabase
          .from("mrr_summary")
          .select("*")
          .single();
        if (mrrData) setMrr(mrrData as MrrData);

        // Subscriptions
        const { data: subData } = await supabase.rpc("get_subscriptions_summary");
        if (subData) setSubs(subData as any);
      } catch (e) {
        console.error("Erro ao carregar financeiro:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  const active = subs.filter(s => s.status === "active");
  const paused = subs.filter(s => s.status === "paused");
  const cancelled = subs.filter(s => s.status === "cancelled");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Métricas de receita, clientes ativos e churn
        </p>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12 text-sm">Carregando...</div>
      ) : !mrr ? (
        <div className="bg-admin-card border border-admin-card-border rounded-xl p-8 text-center">
          <AlertCircle size={32} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm">Sem dados financeiros ainda</p>
          <p className="text-xs text-muted-foreground mt-1">
            As métricas aparecem após o primeiro pagamento confirmado
          </p>
        </div>
      ) : (
        <>
          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                    <DollarSign size={12} /> MRR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{formatBRL(mrr.mrr)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Receita Mensal Recorrente
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                    <TrendingUp size={12} /> ARR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatBRL(mrr.arr)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ARR = MRR × 12
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                    <Users size={12} /> Clientes ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{mrr.active_customers}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {mrr.starter_count} Starter · {mrr.pro_count} Pro
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                    <TrendingDown size={12} /> Churn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {mrr.total_customers > 0
                      ? ((cancelled.length / mrr.total_customers) * 100).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {cancelled.length} cancelados / {mrr.total_customers} total
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Receita por plano */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Receita por plano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-secondary">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">Starter</Badge>
                    <span className="text-xs text-muted-foreground">{mrr.starter_count} clientes</span>
                  </div>
                  <p className="text-xl font-bold">{formatBRL(mrr.starter_revenue)}</p>
                  <p className="text-[10px] text-muted-foreground">R$ 97/mês cada</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-primary text-primary-foreground">Pro</Badge>
                    <span className="text-xs text-muted-foreground">{mrr.pro_count} clientes</span>
                  </div>
                  <p className="text-xl font-bold text-primary">{formatBRL(mrr.pro_revenue)}</p>
                  <p className="text-[10px] text-muted-foreground">R$ 197/mês cada</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de assinaturas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assinaturas ({subs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {subs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma assinatura registrada ainda
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b">
                        <th className="pb-2 font-medium">Restaurante</th>
                        <th className="pb-2 font-medium">Plano</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Valor</th>
                        <th className="pb-2 font-medium">Início</th>
                        <th className="pb-2 font-medium">Renova em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subs.map(s => (
                        <tr key={s.id} className="border-b last:border-0 hover:bg-secondary/50">
                          <td className="py-3">
                            <p className="font-medium">{s.restaurant_name}</p>
                            <p className="text-[10px] text-muted-foreground">{s.restaurant_slug}</p>
                          </td>
                          <td className="py-3">
                            <Badge variant={s.plan === "pro" ? "default" : "outline"}>
                              {s.plan}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge
                              variant={
                                s.status === "active" ? "default" :
                                s.status === "paused" ? "secondary" : "destructive"
                              }
                              className={
                                s.status === "active" ? "bg-green-500/15 text-green-400" :
                                s.status === "paused" ? "bg-yellow-500/15 text-yellow-400" : ""
                              }
                            >
                              {s.status === "active" && "● "}
                              {s.status === "active" ? "Ativa" :
                               s.status === "paused" ? "Pausada" : "Cancelada"}
                            </Badge>
                          </td>
                          <td className="py-3 font-medium">{formatBRL(s.amount)}</td>
                          <td className="py-3 text-xs text-muted-foreground">
                            {new Date(s.started_at).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-3 text-xs text-muted-foreground">
                            {s.current_period_end
                              ? new Date(s.current_period_end).toLocaleDateString("pt-BR")
                              : "—"}
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
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, CalendarDays, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSubscriptions, calcularDiasRestantes } from "@/services/master";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function MasterSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Awaited<ReturnType<typeof getSubscriptions>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubscriptions()
      .then(setSubscriptions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: subscriptions.length,
    ativos: subscriptions.filter(s => s.active).length,
    trial: subscriptions.filter(s => s.plan === "trial").length,
    expirados: subscriptions.filter(s => s.plan_expires_at && calcularDiasRestantes(s.plan_expires_at).expirado).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Assinaturas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie os planos e veja os dias restantes de cada restaurante</p>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Carregando assinaturas...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total", value: stats.total, icon: CreditCard, color: "text-blue-400" },
              { label: "Ativos", value: stats.ativos, icon: CheckCircle2, color: "text-green-400" },
              { label: "Em trial", value: stats.trial, icon: Clock, color: "text-yellow-400" },
              { label: "Expirados", value: stats.expirados, icon: AlertCircle, color: "text-red-400" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-admin-card border border-admin-card-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <s.icon size={16} className={s.color} />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-admin-card border border-admin-card-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left p-3 font-medium">Restaurante</th>
                    <th className="text-left p-3 font-medium">Plano</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Criado em</th>
                    <th className="text-left p-3 font-medium">Expira em</th>
                    <th className="text-left p-3 font-medium">Dias restantes</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground text-sm">Nenhum restaurante encontrado</td></tr>
                  ) : (
                    subscriptions.map((sub, i) => {
                      const { dias, expirado } = calcularDiasRestantes(sub.plan_expires_at);
                      const dataExpiracao = sub.plan_expires_at || sub.trial_ends;
                      const diasRest = sub.plan_expires_at ? dias : (sub.trial_ends ? calcularDiasRestantes(sub.trial_ends).dias : 0);

                      let statusBadge: { label: string; color: string };
                      if (!sub.active) {
                        statusBadge = { label: "Inativo", color: "bg-red-500/15 text-red-400" };
                      } else if (expirado) {
                        statusBadge = { label: "Expirado", color: "bg-red-500/15 text-red-400" };
                      } else if (sub.plan === "trial") {
                        statusBadge = { label: "Trial", color: "bg-yellow-500/15 text-yellow-400" };
                      } else {
                        statusBadge = { label: "Ativo", color: "bg-green-500/15 text-green-400" };
                      }

                      let diasColor = "text-green-400";
                      if (diasRest <= 7 && diasRest > 0) diasColor = "text-yellow-400";
                      if (diasRest <= 3 || expirado) diasColor = "text-red-400";
                      if (!dataExpiracao) diasColor = "text-muted-foreground";

                      return (
                        <motion.tr key={sub.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                          className="border-b border-border last:border-0 hover:bg-[hsl(0,0%,12%)] transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${sub.active ? "bg-green-500" : "bg-red-500"}`} />
                              <div>
                                <p className="font-medium text-foreground">{sub.name}</p>
                                <p className="text-xs text-muted-foreground">{sub.city || "—"} {sub.whatsapp_number ? `· ${sub.whatsapp_number}` : ""}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-xs px-2 py-1 rounded-full bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,17%)] capitalize">{sub.plan || "sem plano"}</span>
                          </td>
                          <td className="p-3">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>{statusBadge.label}</span>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">{formatDate(sub.created_at)}</td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {dataExpiracao ? formatDate(dataExpiracao) : <span className="text-muted-foreground/50">—</span>}
                          </td>
                          <td className="p-3">
                            {dataExpiracao ? (
                              <div className="flex items-center gap-2">
                                <div className={`text-sm font-bold ${diasColor}`}>
                                  {expirado ? "Expirado" : `${diasRest} dias`}
                                </div>
                                {diasRest <= 7 && !expirado && (
                                  <CalendarDays size={14} className="text-yellow-400" />
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50 text-xs">Sem expiração</span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

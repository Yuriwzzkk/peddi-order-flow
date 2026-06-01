import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { getReports } from "@/services/reports";

const periods = ["Hoje", "Semana", "Mês"];
const tabs = ["Visão geral", "Atendentes", "Cardápio", "Financeiro"];

export default function Reports() {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurant_id;
  const [period, setPeriod] = useState("Semana");
  const [tab, setTab] = useState("Visão geral");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    getReports(restaurantId, period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [restaurantId, period]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Relatórios</h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          {periods.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Carregando relatórios...</div>
      ) : (
        <>
          {tab === "Visão geral" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Total de pedidos", value: data?.metrics?.totalOrders ?? "—" },
                  { label: "Faturamento total", value: data?.metrics?.totalRevenue ? `R$${data.metrics.totalRevenue.toLocaleString("pt-BR")}` : "—" },
                  { label: "Ticket médio", value: data?.metrics?.avgTicket ? `R$${data.metrics.avgTicket.toFixed(2).replace(".", ",")}` : "—" },
                  { label: "Taxa de retorno", value: data?.metrics?.returningRate ? `${data.metrics.returningRate}%` : "—" },
                ].filter(Boolean).map((m: any, i: number) => (
                  <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="bg-admin-card border border-admin-card-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                    <p className="text-xl font-bold text-foreground">{m.value}</p>
                  </motion.div>
                ))}
              </div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-admin-card border border-admin-card-border rounded-xl p-4">
                <h2 className="text-sm font-semibold text-foreground mb-4">Faturamento</h2>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(data?.revenueByDay || []).slice(0, 7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--admin-card-border))" />
                      <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--admin-card))", border: "1px solid hsl(var(--admin-card-border))", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="bg-admin-card border border-admin-card-border rounded-xl p-4">
                <h2 className="text-sm font-semibold text-foreground mb-4">Produtos mais vendidos</h2>
                <div className="space-y-4">
                  {(data?.topItems || []).map((item: any, i: number) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary w-5">{i + 1}°</span>
                          <span className="font-medium text-foreground">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{item.qty} vendas</span>
                          <span className="text-foreground font-medium">R${(item.revenue || 0).toLocaleString("pt-BR")}</span>
                        </div>
                      </div>
                      <Progress value={item.pct || 0} className="h-2 bg-secondary [&>div]:bg-primary" />
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          {tab === "Atendentes" && (
            <>
              <div className="space-y-3">
                {(data?.attendantData || []).map((a: any, i: number) => (
                  <motion.div key={a.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-admin-card border border-admin-card-border rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{a.medal}</span>
                      <span className="text-sm font-semibold text-foreground">{a.name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{a.pedidos} pedidos</span>
                  </motion.div>
                ))}
              </div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-admin-card border border-admin-card-border rounded-xl p-4">
                <h2 className="text-sm font-semibold text-foreground mb-4">Comparativo de pedidos</h2>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(data?.attendantData || []).slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--admin-card-border))" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--admin-card))", border: "1px solid hsl(var(--admin-card-border))", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                      <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </>
          )}

          {tab === "Cardápio" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-admin-card border border-admin-card-border rounded-xl p-4">
              <h2 className="text-sm font-semibold text-foreground mb-4">Ranking de produtos</h2>
              <div className="space-y-4">
                {(data?.topItems || []).map((item: any, i: number) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary w-5">{i + 1}°</span>
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{item.qty} vendas</span>
                        <span className="text-foreground font-medium">R${(item.revenue || 0).toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                    <Progress value={item.pct || 0} className="h-2 bg-secondary [&>div]:bg-primary" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "Financeiro" && (
            <>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-admin-card border border-admin-card-border rounded-xl p-4">
                <h2 className="text-sm font-semibold text-foreground mb-4">Por forma de pagamento</h2>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="h-48 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data?.paymentMethods || []} cx="50%" cy="50%" outerRadius={70} dataKey="value" stroke="none">
                          {(data?.paymentMethods || []).map((entry: any, index: number) => (
                            <Cell key={index} fill={entry.color || "hsl(var(--primary))"} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--admin-card))", border: "1px solid hsl(var(--admin-card-border))", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {(data?.paymentMethods || []).map((p: any) => (
                      <div key={p.name} className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color || "hsl(var(--primary))" }} />
                        <span className="text-foreground">{p.name}</span>
                        <span className="text-primary font-bold">{p.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-admin-card border border-admin-card-border rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Faturamento atual</p>
                  <p className="text-xl font-bold text-primary">R${(data?.currentRevenue || 0).toLocaleString("pt-BR")}</p>
                </div>
                <div className="bg-admin-card border border-admin-card-border rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Período anterior</p>
                  <p className="text-xl font-bold text-foreground">R${(data?.prevRevenue || 0).toLocaleString("pt-BR")}</p>
                </div>
              </div>
              <div className="bg-admin-card border border-admin-card-border rounded-xl p-4">
                <h2 className="text-sm font-semibold text-foreground mb-2">Período atual vs anterior</h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Atual</p>
                    <p className="text-lg font-bold text-primary">R${(data?.currentRevenue || 0).toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Anterior</p>
                    <p className="text-lg font-bold text-foreground">R${(data?.prevRevenue || 0).toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="text-sm font-bold text-status-ready">
                    {data?.revenueChange ? `${data.revenueChange > 0 ? "+" : ""}${data.revenueChange}%` : "—"}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

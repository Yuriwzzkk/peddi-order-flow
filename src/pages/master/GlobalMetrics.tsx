import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { getAllRestaurantsSummary } from "@/services/master";
import type { GlobalStats } from "@/services/master";

const periods = ["7d", "15d", "30d", "90d"];
const COLORS = ["hsl(0 100% 50%)", "hsl(0 0% 42%)", "hsl(45 90% 60%)"];

export default function GlobalMetrics() {
  const [data, setData] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    setLoading(true);
    getAllRestaurantsSummary()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const topRestaurants = (data?.restaurants || [])
    .sort((a, b) => b.orders_today - a.orders_today)
    .slice(0, 10)
    .map((r, i) => ({
      name: r.name,
      orders: r.orders_today,
    }));

  const planNames = [...new Set((data?.restaurants || []).map(r => r.plan))];
  const planData = planNames.map((plan, i) => ({
    name: plan,
    value: (data?.restaurants || []).filter(r => r.plan === plan).length,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Métricas globais</h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-admin-card border border-admin-card-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Total restaurantes</p>
              <p className="text-2xl font-bold">{data?.total || 0}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-admin-card border border-admin-card-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Ativos</p>
              <p className="text-2xl font-bold text-green-400">{data?.active || 0}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-admin-card border border-admin-card-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Pedidos hoje</p>
              <p className="text-2xl font-bold">{data?.today_orders || 0}</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-admin-card border border-admin-card-border rounded-xl p-4">
              <h2 className="text-sm font-semibold mb-3">Top Restaurantes (pedidos hoje)</h2>
              <div className="space-y-3">
                {topRestaurants.map((r, i) => (
                  <div key={r.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary w-5">{i + 1}°</span>
                      <span className="text-foreground truncate max-w-[200px]">{r.name}</span>
                    </div>
                    <span className="text-muted-foreground">{r.orders} pedidos</span>
                  </div>
                ))}
                {topRestaurants.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido hoje</p>}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-admin-card border border-admin-card-border rounded-xl p-4">
              <h2 className="text-sm font-semibold mb-3">Planos</h2>
              <div className="flex flex-col items-center gap-4">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={planData} cx="50%" cy="50%" outerRadius={60} dataKey="value" stroke="none">
                        {planData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--admin-card))", border: "1px solid hsl(var(--admin-card-border))", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4">
                  {planData.map(p => (
                    <div key={p.name} className="flex items-center gap-1 text-xs">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-muted-foreground">{p.name}: <strong className="text-foreground">{p.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

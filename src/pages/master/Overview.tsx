import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";
import { getGlobalStats } from "@/services/master";
import type { GlobalStats } from "@/services/master";

export default function Overview() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getGlobalStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Restaurantes ativos", value: stats?.active?.toString() || "—", icon: UtensilsCrossed, change: `Total: ${stats?.total || 0}` },
    { label: "Pedidos hoje (todos)", value: stats?.today_orders?.toString() || "—", icon: ShoppingBag, change: "Em todo o sistema" },
    { label: "Faturamento plataforma", value: stats?.today_revenue ? `R$${stats.today_revenue.toLocaleString("pt-BR")}` : "—", icon: DollarSign, change: "Hoje" },
    { label: "Em trial", value: stats?.trial?.toString() || "—", icon: TrendingUp, change: "Em período de teste" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Visão geral</h1>

      {loading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cards.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-admin-card border border-admin-card-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <s.icon size={16} className="text-primary" />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-green-400 mt-1">{s.change}</p>
              </motion.div>
            ))}
          </div>

          {stats?.restaurants && stats.restaurants.length > 0 && (
            <div className="bg-admin-card border border-admin-card-border rounded-xl p-4">
              <h2 className="text-sm font-semibold mb-4">Restaurantes ativos</h2>
              <div className="space-y-3">
                {stats.restaurants.slice(0, 10).map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${r.active ? "bg-green-500" : "bg-red-500"}`} />
                      <div>
                        <p className="text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.city || "—"} · {r.plan} · {r.orders_today} pedidos hoje</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">R${(r.revenue_today || 0).toLocaleString("pt-BR")}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

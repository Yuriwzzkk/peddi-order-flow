import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardStats } from "@/services/dashboard";
import { listOrders } from "@/services/orders";
import type { DashboardStats, Order } from "@/types";

export default function DeliveryProfile() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.restaurant_id || !profile?.id) return;
    const load = async () => {
      try {
        const [dash, orders] = await Promise.all([
          getDashboardStats(profile.restaurant_id!, "Hoje"),
          listOrders(profile.restaurant_id!),
        ]);
        setStats(dash);
        setRecentDeliveries(
          orders
            .filter((o) => o.delivery_person_id === profile.id && o.status === "completed")
            .slice(0, 10)
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile]);

  const myData = stats?.attendants?.find((a) => a.name === profile?.name);
  const ordersCount = myData?.orders ?? 0;
  const revenueStr = `R$${(myData?.revenue ?? 0).toFixed(2).replace(".", ",")}`;

  const statCards = [
    { label: "Pedidos hoje", value: String(ordersCount) },
    { label: "Faturamento", value: revenueStr },
    { label: "Entregues", value: String(stats?.delivered ?? 0) },
  ];

  const initials = profile?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="space-y-6">
      <div className="bg-admin-card border border-admin-card-border rounded-xl p-6 text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold mx-auto">{initials}</div>
        <h2 className="text-lg font-bold text-foreground">{profile?.name ?? "Carregando..."}</h2>
        <p className="text-sm text-muted-foreground">🛵 Delivery{profile?.shift ? ` · ${profile.shift}` : ""}</p>
        <span className="inline-flex items-center gap-1.5 text-xs text-status-ready">
          <span className="w-2 h-2 rounded-full bg-status-ready" /> Online
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-admin-card border border-admin-card-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-primary">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-admin-card border border-admin-card-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Histórico recente</h3>
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>
        ) : recentDeliveries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma entrega realizada hoje</p>
        ) : (
          recentDeliveries.map((o) => (
            <div key={o.id} className="flex items-center justify-between text-sm border-b border-admin-card-border pb-2 last:border-0">
              <div>
                <span className="text-foreground font-medium">#{o.id.slice(0, 8)}</span>
                <span className="text-muted-foreground ml-2">{o.customer_name}</span>
              </div>
              <div className="text-right">
                <span className="text-primary font-bold">R${Number(o.total).toFixed(2).replace(".", ",")}</span>
                <span className="text-muted-foreground text-xs ml-2">
                  {new Date(o.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

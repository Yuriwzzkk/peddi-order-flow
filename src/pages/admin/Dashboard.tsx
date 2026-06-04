import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, DollarSign, Clock, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardStats } from "@/services/dashboard";
import { listOrders, subscribeOrders } from "@/services/orders";
import type { DashboardStats } from "@/types";

function useAnimatedNumber(target: number, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round((target) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return val;
}

const periods = ["Hoje", "7 dias", "15 dias", "30 dias"];

export default function Dashboard() {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurant_id;
  const [period, setPeriod] = useState("Hoje");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attendantModal, setAttendantModal] = useState<{ name: string; orders: number; revenue: number; hours: string; payment: string } | null>(null);
  const [chartData, setChartData] = useState<{ hour: string; pedidos: number }[]>([]);
  const [activities, setActivities] = useState<{ icon: string; text: string; time: string }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{ icon: string; label: string; pct: number }[]>([]);
  const [attendants, setAttendants] = useState<{ name: string; orders: number; revenue: number; hours: string; payment: string }[]>([]);
  const [deliveryPct, setDeliveryPct] = useState(50);
  const [presencialPct, setPresencialPct] = useState(50);

  const loadStats = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const data = await getDashboardStats(restaurantId, period);
      setStats(data);
      setChartData(data.hourlyOrders?.length ? data.hourlyOrders : [
        { hour: "10h", pedidos: 0 }, { hour: "12h", pedidos: 0 }, { hour: "14h", pedidos: 0 },
        { hour: "16h", pedidos: 0 }, { hour: "18h", pedidos: 0 }, { hour: "20h", pedidos: 0 }, { hour: "22h", pedidos: 0 },
      ]);
      setPaymentMethods(data.paymentMethods?.length ? data.paymentMethods.map(p => ({
        icon: p.method === "pix" ? "📱" : p.method === "card" ? "💳" : "💵",
        label: p.method === "pix" ? "Pix" : p.method === "card" ? "Cartão" : "Dinheiro",
        pct: p.pct,
      })) : paymentMethods);
      setAttendants(data.attendants?.length ? data.attendants : attendants);
      setActivities(data.recentActivity?.length ? data.recentActivity : activities);
      setDeliveryPct(data.deliveryPct ?? 50);
      setPresencialPct(data.presencialPct ?? 50);
    } catch {
      // keep defaults if loading fails
    }
  }, [restaurantId, period]);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (!restaurantId) return;
    const channel = subscribeOrders(restaurantId, () => { loadStats(); });
    return () => { channel.unsubscribe(); };
  }, [restaurantId, loadStats]);

  const statsCards = stats ? [
    { label: "Pedidos hoje", value: stats.ordersToday, change: `${stats.ordersToday > 0 ? "+" : ""}${stats.ordersToday}`, up: stats.ordersToday > 0, icon: ShoppingBag },
    { label: "Faturamento", value: stats.revenue, change: `R$${stats.revenue}`, up: true, icon: DollarSign, prefix: "R$" },
    { label: "Preparando", value: stats.preparing, change: "agora", up: true, icon: Clock },
    { label: "Entregues", value: stats.delivered, change: "hoje", up: true, icon: CheckCircle },
  ] : [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5 overflow-x-auto">
          {periods.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-admin-card border border-admin-card-border rounded-xl p-4 relative overflow-hidden">
            <stat.icon size={18} className="text-primary absolute top-4 right-4" />
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground">
              {stat.prefix ? "R$ " : ""}<AnimatedNum target={stat.value} />
            </p>
            <div className="flex items-center gap-1 mt-1">
              {stat.up ? <TrendingUp size={12} className="text-status-ready" /> : <TrendingDown size={12} className="text-destructive" />}
              <span className={`text-xs ${stat.up ? "text-status-ready" : "text-destructive"}`}>{stat.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-admin-card border border-admin-card-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">Delivery vs Presencial</h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">🛵 Delivery</span>
              <span className="text-primary font-bold">{deliveryPct}%</span>
            </div>
            <Progress value={deliveryPct} className="h-3 bg-secondary [&>div]:bg-primary" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-foreground"> Presencial</span>
              <span className="text-muted-foreground font-bold">{presencialPct}%</span>
            </div>
            <Progress value={presencialPct} className="h-3 bg-secondary [&>div]:bg-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Melhor canal: {deliveryPct > presencialPct ? "🛵 Delivery" : "🧍 Presencial"}</p>
        </div>
      </motion.div>

      {attendants.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-admin-card border border-admin-card-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Desempenho dos atendentes</h2>
          <div className="space-y-3">
            {attendants.map((a, i) => (
              <button key={a.name} onClick={() => setAttendantModal(a)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary w-5">{i + 1}°</span>
                  <span className="text-sm font-medium text-foreground">{a.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{a.orders} pedidos</span>
                  {i === 0 && <span>⭐</span>}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <Dialog open={!!attendantModal} onOpenChange={() => setAttendantModal(null)}>
        <DialogContent className="bg-admin-card border-admin-card-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">{attendantModal?.name}</DialogTitle>
          </DialogHeader>
          {attendantModal && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { label: "Pedidos", value: attendantModal.orders.toString() },
                { label: "Faturamento", value: `R$${attendantModal.revenue}` },
                { label: "Horário ativo", value: attendantModal.hours },
                { label: "Pagamento +usado", value: attendantModal.payment },
              ].map(m => (
                <div key={m.label} className="bg-secondary rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-primary">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {paymentMethods.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="grid grid-cols-3 gap-3">
          {paymentMethods.map((pm) => (
            <div key={pm.label} className="bg-admin-card border border-admin-card-border rounded-xl p-4 text-center">
              <span className="text-2xl">{pm.icon}</span>
              <p className="text-sm font-medium text-foreground mt-1">{pm.label}</p>
              <p className="text-xl font-bold text-primary">{pm.pct}%</p>
            </div>
          ))}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-admin-card border border-admin-card-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">Pedidos do dia</h2>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--admin-card-border))" />
              <XAxis dataKey="hour" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--admin-card))", border: "1px solid hsl(var(--admin-card-border))", borderRadius: 8, color: "#fff", fontSize: 12 }} cursor={{ fill: "hsl(var(--primary) / 0.1)" }} />
              <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-admin-card border border-admin-card-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">Atividade recente</h2>
        <div className="space-y-3">
          {activities.map((a, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-base mt-0.5">{a.icon}</span>
              <span className="flex-1 text-foreground">{a.text}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function AnimatedNum({ target }: { target: number }) {
  const val = useAnimatedNumber(target);
  return <>{val.toLocaleString("pt-BR")}</>;
}

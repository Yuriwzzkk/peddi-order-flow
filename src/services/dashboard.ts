import { supabase } from "@/lib/supabase";
import type { DashboardStats } from "@/types";

function getDateRange(period: string): { start: Date; end: Date; previousStart: Date } {
  const end = new Date();
  const endStr = end.toISOString();
  let start: Date;
  switch (period) {
    case "7 dias":
      start = new Date(end.getTime() - 7 * 86400000);
      break;
    case "15 dias":
      start = new Date(end.getTime() - 15 * 86400000);
      break;
    case "30 dias":
      start = new Date(end.getTime() - 30 * 86400000);
      break;
    default:
      start = new Date(end);
      start.setHours(0, 0, 0, 0);
  }
  const diff = end.getTime() - start.getTime();
  const previousStart = new Date(start.getTime() - diff);
  return { start, end, previousStart };
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    confirmed: "confirmado",
    preparing: "em preparo",
    ready: "pronto",
    delivery: "em entrega",
    completed: "entregue",
    cancelled: "cancelado",
  };
  return map[status] || status;
}

export async function getDashboardStats(restaurantId: string, period: string): Promise<DashboardStats> {
  const { start, end, previousStart } = getDateRange(period);

  const { data: currentOrders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (error) throw error;

  const { data: previousOrders } = await supabase
    .from("orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", previousStart.toISOString())
    .lt("created_at", start.toISOString());

  const current = currentOrders ?? [];
  const previous = previousOrders ?? [];

  const total = current.length;
  const prevTotal = previous.length;
  const revenue = current.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const prevRevenue = previous.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const preparing = current.filter((o) => o.status === "preparing").length;
  const delivered = current.filter((o) => o.status === "completed").length;

  const deliveryCount = current.filter((o) => o.type === "delivery").length;
  const deliveryPct = total ? Math.round((deliveryCount / total) * 100) : 0;
  const presencialPct = 100 - deliveryPct;

  const paymentCounts: Record<string, number> = {};
  current.forEach((o) => {
    if (o.payment_method) {
      paymentCounts[o.payment_method] = (paymentCounts[o.payment_method] || 0) + 1;
    }
  });
  const paymentMethods = Object.entries(paymentCounts).map(([method, count]) => ({
    method,
    pct: total ? Math.round((count / total) * 100) : 0,
  }));

  const hourlyMap: Record<string, number> = {};
  current.forEach((o) => {
    const hour = new Date(o.created_at).getHours();
    const key = `${hour}h`;
    hourlyMap[key] = (hourlyMap[key] || 0) + 1;
  });
  const hourlyOrders = Array.from({ length: 24 }, (_, i) => {
    const key = `${i}h`;
    return { hour: key, pedidos: hourlyMap[key] || 0 };
  });

  const { data: attendants } = await supabase
    .from("profiles")
    .select("id, name, type, shift")
    .eq("restaurant_id", restaurantId)
    .in("type", ["delivery", "presencial"]);

  const attendantsData = (attendants ?? []).map((a) => {
    const attOrders = current.filter((o) => o.attendant_id === a.id || o.delivery_person_id === a.id);
    const paymentMethodsForAtt = [...new Set(attOrders.map((o) => o.payment_method).filter(Boolean))];
    return {
      name: a.name,
      orders: attOrders.length,
      revenue: attOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
      hours: a.shift || "N/A",
      payment: paymentMethodsForAtt.length ? paymentMethodsForAtt[0] : "N/A",
    };
  }).sort((a, b) => b.orders - a.orders);

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, customer_name, total, status, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentActivity = (recentOrders ?? []).map((o) => {
    const t = `R$${Number(o.total).toFixed(2).replace(".", ",")}`;
    const icon = o.status === "new" ? "🟠" : "✅";
    const text = o.status === "new"
      ? `Novo pedido #${o.id.slice(0, 4)} — ${o.customer_name} — ${t}`
      : `Pedido #${o.id.slice(0, 4)} ${getStatusLabel(o.status)} — ${o.customer_name}`;
    return { icon, text, time: getTimeAgo(o.created_at) };
  });

  const fmtChange = (current: number, prev: number): string => {
    if (prev === 0) return current > 0 ? "+novo" : "—";
    const pct = Math.round(((current - prev) / prev) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  };

  return {
    ordersToday: total,
    revenue,
    preparing,
    delivered,
    deliveryPct,
    presencialPct,
    paymentMethods,
    hourlyOrders,
    attendants: attendantsData,
    recentActivity,
  };
}

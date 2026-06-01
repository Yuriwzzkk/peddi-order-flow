import { supabase } from "@/lib/supabase";

function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  const endStr = end.toISOString();
  let start: Date;
  switch (period) {
    case "Mês":
      start = new Date(end.getTime() - 30 * 86400000);
      break;
    case "Semana":
      start = new Date(end.getTime() - 7 * 86400000);
      break;
    default:
      start = new Date(end);
      start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

export async function getReports(restaurantId: string, period: string) {
  const { start, end } = getDateRange(period);
  const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));

  const { data: currentOrders } = await supabase
    .from("orders")
    .select("id, total, status, payment_method, attendant_id, created_at")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const { data: prevOrders } = await supabase
    .from("orders")
    .select("id, total, status, payment_method, created_at")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", prevStart.toISOString())
    .lt("created_at", start.toISOString());

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("id, name, sales_count, price")
    .eq("restaurant_id", restaurantId)
    .order("sales_count", { ascending: false })
    .limit(10);

  const current = currentOrders ?? [];
  const prev = prevOrders ?? [];

  const totalOrders = current.length;
  const totalRevenue = current.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const prevRevenue = prev.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const avgTicket = totalOrders ? totalRevenue / totalOrders : 0;
  const returningRate = prev.length > 0 ? Math.round((totalOrders / (totalOrders + prev.length)) * 100) : 0;

  const paymentCounts: Record<string, { count: number; total: number }> = {};
  current.forEach((o) => {
    const m = o.payment_method || "outros";
    if (!paymentCounts[m]) paymentCounts[m] = { count: 0, total: 0 };
    paymentCounts[m].count++;
    paymentCounts[m].total += Number(o.total) || 0;
  });
  const paymentMethods = Object.entries(paymentCounts).map(([method, data]) => ({
    method,
    pct: totalOrders ? Math.round((data.count / totalOrders) * 100) : 0,
    total: data.total,
  }));

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const revenueByDay = weekDays.map((day) => {
    const dayOrders = current.filter((o) => {
      const d = new Date(o.created_at);
      return weekDays[d.getDay()] === day;
    });
    return {
      day,
      value: dayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
    };
  });

  const topItems = (menuItems ?? []).map((item, i) => ({
    pos: i + 1,
    name: item.name,
    qty: item.sales_count || 0,
    revenue: (item.sales_count || 0) * Number(item.price),
    pct: i === 0 ? 100 : menuItems[0]?.sales_count ? Math.round(((item.sales_count || 0) / (menuItems[0]?.sales_count || 1)) * 100) : 0,
  }));

  const attendantOrders: Record<string, number> = {};
  current.forEach((o) => {
    if (o.attendant_id) {
      attendantOrders[o.attendant_id] = (attendantOrders[o.attendant_id] || 0) + 1;
    }
  });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", Object.keys(attendantOrders));

  const attendantData = (profiles ?? []).map((p) => ({
    name: p.name,
    pedidos: attendantOrders[p.id] || 0,
  })).sort((a, b) => b.pedidos - a.pedidos);

  return {
    metrics: {
      totalOrders,
      totalRevenue,
      avgTicket,
      returningRate,
    },
    revenueByDay,
    topItems,
    attendantData,
    paymentMethods,
    prevRevenue,
    currentRevenue: totalRevenue,
    revenueChange: prevRevenue ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0,
  };
}

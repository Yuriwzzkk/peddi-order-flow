import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { listOrders, updateOrderStatusRPC, completeDeliveryRPC, subscribeOrders } from "@/services/orders";
import type { Order } from "@/types";

const statusConfig: Record<string, { label: string; color: string; next?: string; action?: string }> = {
  new: { label: "Novo pedido", color: "bg-status-new", next: "confirmed", action: "Confirmar" },
  confirmed: { label: "Confirmado", color: "bg-status-confirmed", next: "preparing", action: "Preparar" },
  preparing: { label: "Preparando", color: "bg-status-preparing", next: "ready", action: "Pronto" },
  ready: { label: "Pronto", color: "bg-status-ready", next: "delivery", action: "Iniciar entrega" },
  delivery: { label: "Entrega", color: "bg-status-delivery", next: "completed", action: "Finalizar" },
  completed: { label: "Finalizado", color: "bg-status-completed" },
  cancelled: { label: "Cancelado", color: "bg-status-cancelled" },
};

const defaultStatus = { label: "Desconhecido", color: "bg-muted", next: undefined, action: undefined };

const statusBorderColors: Record<string, string> = {
  new: "border-l-status-new", confirmed: "border-l-status-confirmed", preparing: "border-l-status-preparing",
  ready: "border-l-status-ready", delivery: "border-l-status-delivery", completed: "border-l-status-completed",
  cancelled: "border-l-status-cancelled",
};

const filterLabels: Record<string, string> = { all: "Todos", new: "Novo", confirmed: "Confirmado", preparing: "Preparando", ready: "Pronto", delivery: "Entrega", completed: "Finalizado", cancelled: "Cancelado" };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export default function DeliveryOrders() {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurant_id;

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!restaurantId) return;
    listOrders(restaurantId).then((data) => {
      setOrders(data.filter((o) => o.type === "delivery"));
    }).catch(() => toast.error("Erro ao carregar pedidos"));
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    const sub = subscribeOrders(restaurantId, (order, event) => {
      if (order.type !== "delivery") return;
      setOrders((prev) => {
        if (event === "INSERT") return [order, ...prev];
        if (event === "UPDATE") return prev.map((o) => (o.id === order.id ? order : o));
        return prev;
      });
    });
    return () => sub.unsubscribe();
  }, [restaurantId]);

  const advanceStatus = useCallback(async (order: Order) => {
    try {
      if (order.status === "delivery") {
        const updated = await completeDeliveryRPC(order.id);
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        toast.success("Entrega finalizada com sucesso ✓");
      } else {
        const next = statusConfig[order.status]?.next;
        if (!next) return;
        const updated = await updateOrderStatusRPC(order.id, next);
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        toast.success("Mensagem enviada no WhatsApp ✓");
      }
    } catch {
      toast.error("Erro ao atualizar status");
    }
  }, []);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Meus Pedidos</h1>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {["all", "new", "confirmed", "preparing", "ready", "delivery", "completed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {filterLabels[s]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((order) => {
            const cfg = statusConfig[order.status] || defaultStatus;
            const borderColor = statusBorderColors[order.status] || "border-l-muted";
            return (
            <motion.div key={order.id} layout initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-admin-card border border-admin-card-border rounded-xl overflow-hidden border-l-4 ${borderColor}`}>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">#{order.id.slice(0, 8)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(order.created_at)}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{order.customer_name}</p>
                <div className="space-y-1 border-t border-admin-card-border pt-2">
                  {(order.items || []).map((item, j) => (
                    <div key={j} className="flex justify-between text-xs text-foreground">
                      <span>{item.qty}x {item.name}</span>
                      <span>R${(item.qty * item.price).toFixed(2).replace(".", ",")}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t border-admin-card-border pt-2">
                  <span className="text-sm font-bold text-foreground">Total</span>
                  <span className="text-sm font-bold text-primary">R${order.total.toFixed(2).replace(".", ",")}</span>
                </div>
                {cfg.next && (
                  <Button onClick={() => advanceStatus(order)} className="w-full h-11 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-xl">
                    <Check size={16} className="mr-1" /> {cfg.action}
                  </Button>
                )}
              </div>
            </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { listOrders, updateOrderStatusRPC, subscribeOrders } from "@/services/orders";
import type { Order } from "@/types";

type OrderStatus = Order["status"];

const statusConfig: Record<OrderStatus, { label: string; color: string; next?: OrderStatus; action?: string }> = {
  new: { label: "Novo pedido", color: "bg-status-new", next: "confirmed", action: "Confirmar" },
  confirmed: { label: "Confirmado", color: "bg-status-confirmed", next: "preparing", action: "Preparar" },
  preparing: { label: "Preparando", color: "bg-status-preparing", next: "ready", action: "Pronto" },
  ready: { label: "Pronto", color: "bg-status-ready", next: "delivery", action: "Enviar" },
  delivery: { label: "Entrega", color: "bg-status-delivery", next: "completed", action: "Finalizar" },
  completed: { label: "Finalizado", color: "bg-status-completed" },
  cancelled: { label: "Cancelado", color: "bg-destructive" },
};

const statusBorderColors: Record<OrderStatus, string> = {
  new: "border-l-status-new",
  confirmed: "border-l-status-confirmed",
  preparing: "border-l-status-preparing",
  ready: "border-l-status-ready",
  delivery: "border-l-status-delivery",
  completed: "border-l-status-completed",
  cancelled: "border-l-destructive",
};

const statusFilters: OrderStatus[] = ["new", "confirmed", "preparing", "ready", "delivery", "completed"];
const filterLabels: Record<string, string> = {
  all: "Todos", new: "Novo", confirmed: "Confirmado", preparing: "Preparando", ready: "Pronto", delivery: "Entrega", completed: "Finalizado",
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `h\u00e1 ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `h\u00e1 ${hours}h`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function Orders() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [livePulse, setLivePulse] = useState(false);

  const restaurantId = profile?.restaurant_id;

  useEffect(() => {
    if (!restaurantId) return;
    listOrders(restaurantId).then(setOrders).catch((err) => {
      console.error("Failed to fetch orders", err);
      toast.error("Erro ao carregar pedidos");
    });
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    const subscription = subscribeOrders(restaurantId, (order, event) => {
      if (event === "INSERT") {
        setOrders((prev) => [order, ...prev]);
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 1500);
        toast(`\uD83D\uDF60 Novo pedido! ${order.customer_name} \u00B7 R$${order.total.toFixed(2).replace(".", ",")}`, { duration: 3000 });
      } else if (event === "UPDATE") {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      }
    });
    return () => subscription.unsubscribe();
  }, [restaurantId]);

  const advanceStatus = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const next = statusConfig[order.status]?.next;
    if (!next) return;
    try {
      await updateOrderStatusRPC(orderId, next);
      toast.success("Mensagem enviada no WhatsApp \u2713", { duration: 2000 });
    } catch {
      toast.error("Erro ao atualizar pedido");
    }
  }, [orders]);

  const openCount = orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length;
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const OrderCard = ({ order }: { order: Order }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-admin-card border border-admin-card-border rounded-xl overflow-hidden border-l-4 ${statusBorderColors[order.status]}`}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">#{order.id}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${statusConfig[order.status].color}`}>
              {statusConfig[order.status].label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{relativeTime(order.created_at)}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{order.customer_name}</p>
          <p className="text-xs text-muted-foreground">\uD83D\uDCF1 {order.channel} \u00B7 {order.type}</p>
        </div>
        <div className="space-y-1 border-t border-admin-card-border pt-2">
          {order.items.map((item, j) => (
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
        <div className="flex gap-2">
          {statusConfig[order.status].next && (
            <Button
              size="sm"
              className="flex-1 h-10 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg"
              onClick={() => advanceStatus(order.id)}
            >
              <Check size={14} className="mr-1" />
              {statusConfig[order.status].action}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-10 border-admin-card-border text-muted-foreground hover:text-foreground text-xs rounded-lg"
            onClick={() => navigate("/admin/conversas")}
          >
            <MessageCircle size={14} className="mr-1" />
            Conversa
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Pedidos</h1>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full bg-status-ready ${livePulse ? "animate-pulse-glow" : ""}`} />
          <span className="text-xs text-muted-foreground">Ao vivo \u00B7 {openCount} em aberto</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
        <button
          onClick={() => setFilter("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Todos
        </button>
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {filterLabels[s]}
          </button>
        ))}
      </div>

      {isMobile ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-3 min-h-[60vh]">
          {statusFilters.map((status) => {
            const statusOrders = orders.filter((o) => o.status === status);
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusConfig[status].color}`} />
                  <span className="text-xs font-semibold text-foreground">{statusConfig[status].label}</span>
                  <span className="text-xs text-muted-foreground">({statusOrders.length})</span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {statusOrders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

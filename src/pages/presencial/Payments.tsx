import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { listOrders } from "@/services/orders";
import type { Order } from "@/types";

const methodIcon: Record<string, string> = {
  Pix: "📱",
  "Cartão": "💳",
  Dinheiro: "💵",
};

function formatMethod(method: string | null): string {
  if (!method) return "—";
  const icon = methodIcon[method] || "💳";
  return `${icon} ${method}`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function PresencialPayments() {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurant_id;

  const [payments, setPayments] = useState<Order[]>([]);

  useEffect(() => {
    if (!restaurantId) return;
    listOrders(restaurantId)
      .then((data) =>
        setPayments(data.filter((o) => o.type === "presencial" && o.status === "completed"))
      )
      .catch(() => toast.error("Erro ao carregar pagamentos"));
  }, [restaurantId]);

  const totalDay = payments.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Pagamentos</h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-admin-card border border-admin-card-border rounded-xl p-4 text-center"
      >
        <p className="text-xs text-muted-foreground mb-1">💰 Total hoje</p>
        <p className="text-2xl font-bold text-primary">
          R${totalDay.toFixed(2).replace(".", ",")}
        </p>
      </motion.div>

      <div className="space-y-3">
        {payments.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-admin-card border border-admin-card-border rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-foreground">#{p.id.slice(0, 8)}</span>
              <span className="text-xs text-muted-foreground">{formatTime(p.created_at)}</span>
            </div>
            <p className="text-sm text-muted-foreground">{p.customer_name}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-bold text-primary">
                R${p.total.toFixed(2).replace(".", ",")}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatMethod(p.payment_method)}
                {p.change_for != null && p.change_for > 0 && (
                  <span className="ml-1">
                    (troco R${p.change_for.toFixed(2).replace(".", ",")})
                  </span>
                )}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

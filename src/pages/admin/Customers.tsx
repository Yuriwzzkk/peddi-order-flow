import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { listCustomers } from "@/services/customers";
import type { Customer } from "@/types";

const statusColors: Record<string, string> = {
  recorrente: "text-status-ready",
  novo: "text-status-confirmed",
  inativo: "text-muted-foreground",
};
const statusLabels: Record<string, string> = {
  recorrente: "🟢 Cliente recorrente",
  novo: "🔵 Cliente novo",
  inativo: "⚪ Inativo",
};
const filters = ["Todos", "Recorrentes", "Novos", "Inativos"];
const filterMap: Record<string, string> = { Recorrentes: "recorrente", Novos: "novo", Inativos: "inativo" };

export default function Customers() {
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const restaurantId = profile?.restaurant_id;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    listCustomers(restaurantId)
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "Todos" || c.status === filterMap[filter];
    return matchSearch && matchFilter;
  });

  const CustomerDetail = ({ customer }: { customer: Customer }) => (
    <div className="space-y-4">
      {isMobile && (
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <ArrowLeft size={16} /> Voltar
        </button>
      )}
      <div className="bg-admin-card border border-admin-card-border rounded-xl p-5 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold mx-auto">
          {customer.name?.[0] || "?"}
        </div>
        <h2 className="text-lg font-bold text-foreground">{customer.name}</h2>
        <p className="text-sm text-muted-foreground">{customer.phone}</p>
        <p className={`text-sm ${statusColors[customer.status]}`}>{statusLabels[customer.status]}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pedidos", value: customer.total_orders.toString() },
          { label: "Total gasto", value: `R$${customer.total_spent.toFixed(0)}` },
          { label: "Último pedido", value: customer.last_order_at ? new Date(customer.last_order_at).toLocaleDateString("pt-BR") : "Nunca" },
        ].map((s) => (
          <div key={s.label} className="bg-admin-card border border-admin-card-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-primary">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-admin-card border border-admin-card-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Favoritos</h3>
        <div className="flex flex-wrap gap-2">
          {(customer.favorites || []).map((f) => (
            <span key={f} className="text-xs bg-secondary px-2.5 py-1 rounded-full text-muted-foreground">{f}</span>
          ))}
        </div>
      </div>
      {customer.phone && (
        <a href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
          <Button className="w-full h-11 bg-status-ready hover:bg-status-ready/90 text-white font-semibold rounded-xl">
            <MessageCircle size={16} className="mr-2" /> Enviar mensagem no WhatsApp
          </Button>
        </a>
      )}
    </div>
  );

  if (isMobile && selected) {
    return (
      <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
        <CustomerDetail customer={selected} />
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Clientes</h1>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-admin-card-border h-10 text-sm" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Carregando clientes...</div>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => setSelected(c)} className="w-full text-left bg-admin-card border border-admin-card-border rounded-xl p-4 space-y-1 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">{c.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{c.total_orders} pedidos · R${c.total_spent.toFixed(0)} no total</p>
              <p className="text-xs text-muted-foreground">Último pedido: {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("pt-BR") : "Nunca"}</p>
              <p className={`text-xs ${statusColors[c.status]}`}>{statusLabels[c.status]}</p>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">Nenhum cliente encontrado</p>}
        </div>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1 bg-admin-card border border-admin-card-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-card-border">
                  {["Nome", "Telefone", "Pedidos", "Total gasto", "Último pedido", "Status"].map((h) => (
                    <th key={h} className="text-xs font-semibold text-muted-foreground text-left p-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => setSelected(c)} className="border-b border-admin-card-border hover:bg-secondary/50 cursor-pointer transition-colors">
                    <td className="p-3 text-sm font-medium text-foreground">{c.name}</td>
                    <td className="p-3 text-sm text-muted-foreground">{c.phone}</td>
                    <td className="p-3 text-sm text-foreground">{c.total_orders}</td>
                    <td className="p-3 text-sm text-foreground">R${c.total_spent.toFixed(0)}</td>
                    <td className="p-3 text-sm text-muted-foreground">{c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("pt-BR") : "Nunca"}</td>
                    <td className={`p-3 text-xs ${statusColors[c.status]}`}>{statusLabels[c.status]}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground text-sm">Nenhum cliente encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {selected && (
            <div className="w-80 shrink-0">
              <CustomerDetail customer={selected} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

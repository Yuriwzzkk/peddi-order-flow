import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getAllRestaurantsSummary } from "@/services/master";
import type { GlobalStats } from "@/services/master";

type PlanFilter = "all" | "active" | "inactive" | "trial" | "pro" | "starter";

const filters: { label: string; value: PlanFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Ativos", value: "active" },
  { label: "Inativos", value: "inactive" },
  { label: "Trial", value: "trial" },
  { label: "Pro", value: "pro" },
  { label: "Starter", value: "starter" },
];

export default function Restaurants() {
  const [data, setData] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PlanFilter>("all");

  useEffect(() => {
    setLoading(true);
    getAllRestaurantsSummary()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const restaurants = data?.restaurants || [];

  const filtered = restaurants.filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "active") return r.active;
    if (filter === "inactive") return !r.active;
    if (filter === "trial") return r.plan === "Trial";
    if (filter === "pro") return r.plan === "Pro";
    if (filter === "starter") return r.plan === "Starter";
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Restaurantes</h1>
        <div className="text-sm text-muted-foreground">{data?.total || 0} total</div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar restaurante..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-admin-card-border h-10 text-sm" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Carregando...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-admin-card border border-admin-card-border rounded-xl p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${r.active ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm font-semibold text-foreground">{r.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{r.plan}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {r.city || "—"} · {r.orders_today} pedidos hoje · R${(r.revenue_today || 0).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground shrink-0 ml-4">
                <p>{r.total_attendants} atendentes</p>
                {r.whatsapp && <p className="text-green-400">WhatsApp ✓</p>}
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nenhum restaurante encontrado</p>}
        </div>
      )}
    </div>
  );
}

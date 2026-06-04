import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ExternalLink, Search, Shield } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  city: string | null;
  active: boolean;
  plan: string;
}

export default function MasterImpersonate() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { navigate("/admin/login", { replace: true }); return; }
      supabase.from("profiles").select("role").eq("id", session.user.id).single().then(({ data }) => {
        if (data?.role !== "master") { navigate("/admin/dashboard", { replace: true }); return; }
        loadRestaurants();
      });
    });
  }, []);

  const loadRestaurants = async () => {
    const { data } = await supabase
      .from("restaurants")
      .select("id, name, city, active, plan")
      .order("name");
    setRestaurants(data ?? []);
    setLoading(false);
  };

  const accessAs = async (restaurantId: string) => {
    navigate(`/admin/dashboard?master_impersonate=${restaurantId}`);
  };

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.city || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/master")} className="p-2 rounded-lg hover:bg-zinc-900 text-zinc-400">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield size={20} className="text-primary" /> Acesso Mestre
              </h1>
              <p className="text-sm text-zinc-500">Entre no painel de qualquer restaurante</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            placeholder="Buscar restaurante..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-10 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-primary/50"
          />
        </div>

        {loading ? (
          <div className="text-center text-zinc-500 py-8 text-sm">Carregando...</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(r => (
              <button
                key={r.id}
                onClick={() => accessAs(r.id)}
                className="w-full flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-primary/30 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${r.active ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <p className="text-sm font-semibold text-white">{r.name}</p>
                    <p className="text-xs text-zinc-500">{r.city || "—"} · {r.plan}</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-zinc-600 group-hover:text-primary transition-colors" />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-zinc-500 text-sm py-4">Nenhum restaurante encontrado</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

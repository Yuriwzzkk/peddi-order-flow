import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { ShoppingBag, X, Plus, Minus, ChevronLeft, Clock, MapPin } from "lucide-react";
import type { MenuItem, MenuCategory, Restaurant } from "@/types";

interface CartItem extends MenuItem {
  qty: number;
}

export default function DigitalMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: r } = await supabase.from("restaurants").select("*").eq("slug", slug).maybeSingle();
      if (!r) { setLoading(false); return; }
      setRestaurant(r);
      const [cats, prods] = await Promise.all([
        supabase.from("menu_categories").select("*").eq("restaurant_id", r.id).eq("active", true).order("sort_order"),
        supabase.from("menu_items").select("*").eq("restaurant_id", r.id).eq("available", true).order("sort_order"),
      ]);
      setCategories(cats.data ?? []);
      setItems(prods.data ?? []);
      setLoading(false);
    })();
  }, [slug]);

  const filtered = category === "todos" ? items : items.filter(i => i.category_id === category);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F0F" }}>
        <div className="text-zinc-400 text-sm animate-pulse">Carregando cardápio...</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "#0F0F0F" }}>
        <span className="text-6xl">🍽️</span>
        <h1 className="text-xl font-bold text-foreground">Restaurante não encontrado</h1>
        <p className="text-sm text-zinc-400">O link que você acessou não existe ou foi desativado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0F0F0F" }}>
      {/* Header do restaurante */}
      <div className="relative">
        <div className="h-36 bg-gradient-to-b from-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-4">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt={restaurant.name} className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-zinc-800" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center text-3xl border-2 border-zinc-700">🍕</div>
          )}
          <div className="flex-1 pb-1">
            <h1 className="text-2xl font-bold text-foreground">{restaurant.name}</h1>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
              {restaurant.business_hours && (
                <span className="flex items-center gap-1"><Clock size={12} /> {restaurant.business_hours.abre} - {restaurant.business_hours.fecha}</span>
              )}
              {restaurant.city && <span className="flex items-center gap-1"><MapPin size={12} /> {restaurant.city}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="sticky top-0 z-10 pt-2 pb-1 px-4" style={{ background: "#0F0F0F" }}>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setCategory("todos")}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors ${category === "todos" ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
            Todos
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors ${category === c.id ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de produtos */}
      <div className="px-4 pb-32 space-y-3 mt-3">
        {filtered.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden flex">
            {item.image_url && (
              <img src={item.image_url} alt="" className="w-24 h-24 object-cover shrink-0" />
            )}
            <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                  <span className="text-sm font-bold text-primary shrink-0">R${item.price.toFixed(2).replace(".", ",")}</span>
                </div>
                {item.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{item.description}</p>}
              </div>
              <div className="flex items-center justify-between mt-2">
                {item.featured && <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">🔥 Destaque</span>}
                <div className="flex-1" />
                {cart.find(c => c.id === item.id) ? (
                  <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-0.5">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-foreground hover:bg-zinc-700">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-medium text-foreground w-5 text-center">{cart.find(c => c.id === item.id)?.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-foreground hover:bg-zinc-700">
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(item)} className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus size={14} /> Adicionar
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-zinc-500 text-sm py-12">
            <span className="text-4xl block mb-2">😕</span>
            Nenhum item disponível nesta categoria.
          </div>
        )}
      </div>

      {/* Botão flutuante do carrinho */}
      {cartCount > 0 && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto bg-primary hover:brightness-110 text-primary-foreground rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-primary/30 z-20 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">{cartCount} item{cartCount > 1 ? "ns" : ""}</p>
              <p className="text-xs opacity-80">Ver carrinho</p>
            </div>
          </div>
          <span className="text-lg font-bold">R${cartTotal.toFixed(2).replace(".", ",")}</span>
        </motion.button>
      )}

      {/* Carrinho slide-up */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end" onClick={() => setCartOpen(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg mx-auto max-h-[80vh] flex flex-col rounded-t-3xl overflow-hidden" style={{ background: "#1A1A1A" }}>
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h2 className="text-lg font-bold text-foreground">Seu pedido</h2>
                <button onClick={() => setCartOpen(false)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-zinc-800/50 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-zinc-400">R${(item.price * item.qty).toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-0.5">
                      <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-foreground hover:bg-zinc-700">
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium text-foreground w-5 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-foreground hover:bg-zinc-700">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-800 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Total</span>
                  <span className="text-xl font-bold text-foreground">R${cartTotal.toFixed(2).replace(".", ",")}</span>
                </div>
                <button className="w-full py-3 bg-primary hover:brightness-110 text-primary-foreground font-bold rounded-xl transition-all">
                  Fazer pedido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 text-center text-[10px] text-zinc-700 py-2" style={{ background: "#0F0F0F" }}>
        Cardápio digital powered by FoodWaker
      </div>
    </div>
  );
}

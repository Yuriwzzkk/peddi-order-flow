import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { listMenuItems } from "@/services/menu";
import { createOrderWithItems } from "@/services/orders";
import type { MenuItem as MenuItemType } from "@/types";

export default function NewOrder() {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurant_id;

  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [observation, setObservation] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    setLoadingMenu(true);
    listMenuItems(restaurantId)
      .then(setMenuItems)
      .catch(() => toast.error("Erro ao carregar cardápio"))
      .finally(() => setLoadingMenu(false));
  }, [restaurantId]);

  const categories = [...new Set(menuItems.map((i) => i.category_name ?? "Outros"))];

  const addItem = (id: string) => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeItem = (id: string) =>
    setCart((prev) => {
      const n = (prev[id] || 0) - 1;
      if (n <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: n };
    });

  const toggleCategory = (cat: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const cartEntries = Object.entries(cart).map(([id, qty]) => {
    const item = menuItems.find((i) => i.id === id)!;
    return { ...item, qty };
  });

  const totalItems = cartEntries.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cartEntries.reduce((s, i) => s + i.qty * i.price, 0);
  const change = paymentMethod === "Dinheiro" && cashReceived ? parseFloat(cashReceived) - totalPrice : 0;

  const confirmOrder = async () => {
    if (!restaurantId || submitting) return;
    setSubmitting(true);
    try {
      const items = cartEntries.map((i) => ({
        menu_item_id: i.id,
        quantity: i.qty,
      }));
      await createOrderWithItems(restaurantId, restaurantId, {
        items,
        type: "presencial",
        channel: "presencial",
        payment_method: paymentMethod ?? undefined,
        change_for: change > 0 ? change : undefined,
        observation,
      });
      setPaymentOpen(false);
      setSummaryOpen(false);
      setShowSuccess(true);
      toast.success("Pedido registrado com sucesso!");
      setTimeout(() => {
        setShowSuccess(false);
        setCart({});
        setPaymentMethod(null);
        setCashReceived("");
        setObservation("");
      }, 2000);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao registrar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center h-[60vh] gap-4"
      >
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
          <CheckCircle size={80} className="text-primary" />
        </motion.div>
        <h2 className="text-xl font-bold text-foreground">Pedido registrado!</h2>
        <p className="text-sm text-muted-foreground">R${totalPrice.toFixed(2).replace(".", ",")}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2 pb-24">
      <h1 className="text-xl font-bold text-foreground">Novo Pedido</h1>

      {loadingMenu ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando cardápio...</p>
      ) : (
        categories.map((cat) => (
          <div
            key={cat}
            className="bg-admin-card border border-admin-card-border rounded-xl overflow-hidden"
          >
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center justify-between p-3 text-sm font-semibold text-foreground"
            >
              <span>{cat}</span>
              {collapsedCats.has(cat) ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            <AnimatePresence>
              {!collapsedCats.has(cat) && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  {menuItems
                    .filter((i) => (i.category_name ?? "Outros") === cat)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-3 py-3 border-t border-admin-card-border"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{item.name}</p>
                          <p className="text-sm font-bold text-primary">
                            R${item.price.toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                          >
                            <Minus size={18} />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-foreground">
                            {cart[item.id] || 0}
                          </span>
                          <button
                            onClick={() => addItem(item.id)}
                            className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 active:scale-95 transition-all"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))
      )}

      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-16 inset-x-0 z-30 bg-admin-nav border-t border-admin-card-border p-3 flex items-center justify-between"
        >
          <div className="text-sm text-foreground">
            🛒 {totalItems} {totalItems === 1 ? "item" : "itens"} ·{" "}
            <span className="font-bold text-primary">
              R${totalPrice.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSummaryOpen(true)}
              className="h-10 text-xs border-admin-card-border text-muted-foreground rounded-xl"
            >
              Ver resumo ▲
            </Button>
            <Button
              onClick={() => setPaymentOpen(true)}
              className="h-10 text-sm bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl"
            >
              Finalizar →
            </Button>
          </div>
        </motion.div>
      )}

      <Sheet open={summaryOpen} onOpenChange={setSummaryOpen}>
        <SheetContent
          side="bottom"
          className="bg-admin-nav border-admin-card-border rounded-t-2xl max-h-[70vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-foreground">Resumo do pedido</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 py-4">
            {cartEntries.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-foreground">
                    {item.qty}x {item.name}
                  </span>
                  <button onClick={() => removeItem(item.id)} className="text-xs text-destructive">
                    ✕
                  </button>
                </div>
                <span className="text-foreground font-medium">
                  R${(item.qty * item.price).toFixed(2).replace(".", ",")}
                </span>
              </div>
            ))}
            <div className="space-y-2 pt-2 border-t border-admin-card-border">
              <label className="text-xs text-muted-foreground">Observação</label>
              <Textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="bg-secondary border-admin-card-border min-h-[60px] text-sm"
                placeholder="Sem cebola, extra bacon..."
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-admin-card-border">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-lg font-bold text-primary">
                R${totalPrice.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={paymentOpen} onOpenChange={setPaymentOpen}>
        <SheetContent
          side="bottom"
          className="bg-admin-nav border-admin-card-border rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle className="text-foreground">
              💰 Total: R${totalPrice.toFixed(2).replace(".", ",")}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Forma de pagamento:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "📱", label: "Pix" },
                { icon: "💳", label: "Cartão" },
                { icon: "💵", label: "Dinheiro" },
              ].map((m) => (
                <button
                  key={m.label}
                  onClick={() => setPaymentMethod(m.label)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    paymentMethod === m.label
                      ? "border-primary bg-primary/10"
                      : "border-admin-card-border bg-secondary"
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <p className="text-xs text-foreground mt-1">{m.label}</p>
                </button>
              ))}
            </div>
            {paymentMethod === "Dinheiro" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <label className="text-sm text-muted-foreground">Valor recebido:</label>
                <Input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="bg-secondary border-admin-card-border h-11"
                  placeholder="R$ 0,00"
                />
                {parseFloat(cashReceived) > totalPrice && (
                  <p className="text-sm text-primary font-bold">
                    Troco: R${change.toFixed(2).replace(".", ",")}
                  </p>
                )}
              </motion.div>
            )}
            <Button
              onClick={confirmOrder}
              disabled={!paymentMethod || submitting}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl text-base"
            >
              ✅ Confirmar pedido
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

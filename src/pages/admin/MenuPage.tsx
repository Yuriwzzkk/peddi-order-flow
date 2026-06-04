import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Copy, Trash2, Flame, Settings2, Share2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { listCategories, createCategory, updateCategory, deleteCategory, listMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from "@/services/menu";
import type { MenuItem, MenuCategory } from "@/types";

const EMOJIS = ["🍕", "🍔", "🥩", "🍝", "🥗", "🥙", "🌮", "🌯", "🍜", "🍣", "🍱", "🥟", "🍦", "🍰", "🥤", "🍺", "🥃", "☕", "🧃", "🥜", "🧀", "🥚", "🥓", "🐟"];

const emptyForm = { name: "", description: "", price: "", category_id: "", available: true, featured: false, upsell: false, upsellProductId: "", upsellMessage: "" };

export default function MenuPage() {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurant_id;
  const [category, setCategory] = useState("todos");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [catDialog, setCatDialog] = useState<{ open: boolean; edit?: MenuCategory }>({ open: false });
  const [catForm, setCatForm] = useState({ name: "", emoji: "🍕" });
  const [menuSlug, setMenuSlug] = useState("");

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    Promise.all([
      listCategories(restaurantId).then(setCategories).catch(() => {}),
      listMenuItems(restaurantId).then(setItems).catch(() => {}),
      supabase.from("restaurants").select("slug").eq("id", restaurantId).single().then(r => { if (r.data?.slug) setMenuSlug(r.data.slug); }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [restaurantId]);

  const filtered = category === "todos" ? items : items.filter(i => i.category_id === category);

  const toggleField = async (id: string, field: "available" | "featured", value: boolean) => {
    setItems(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    try { await updateMenuItem(id, { [field]: value }); }
    catch { setItems(prev => prev.map(p => p.id === id ? { ...p, [field]: !value } : p)); }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setEditOpen(true);
  };

  const openEdit = (p: MenuItem) => {
    setEditId(p.id);
    setForm({
      name: p.name, description: p.description, price: p.price.toString(),
      category_id: p.category_id || "", available: p.available,
      featured: p.featured, upsell: p.upsell,
      upsellProductId: p.upsell_product_id || "", upsellMessage: p.upsell_message || "",
    });
    setEditOpen(true);
  };

  const duplicate = async (p: MenuItem) => {
    if (!restaurantId) return;
    try {
      const item = await createMenuItem(restaurantId, {
        name: p.name + " (cópia)", description: p.description, price: p.price,
        category_id: p.category_id, available: false, featured: false,
        upsell: false,
      });
      setItems(prev => [...prev, item]);
      toast.success("Produto duplicado!");
    } catch (err: any) { toast.error(err.message); }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteMenuItem(id);
      setItems(prev => prev.filter(p => p.id !== id));
      toast.success("Produto removido!");
    } catch (err: any) { toast.error(err.message); }
  };

  const openCatCreate = () => {
    setCatForm({ name: "", emoji: "🍕" });
    setCatDialog({ open: true });
  };

  const openCatEdit = (c: MenuCategory) => {
    setCatForm({ name: c.name, emoji: c.emoji || "🍽️" });
    setCatDialog({ open: true, edit: c });
  };

  const saveCategory = async () => {
    if (!catForm.name || !restaurantId) return;
    try {
      if (catDialog.edit) {
        await updateCategory(catDialog.edit.id, { name: catForm.name, emoji: catForm.emoji });
        setCategories(prev => prev.map(c => c.id === catDialog.edit!.id ? { ...c, name: catForm.name, emoji: catForm.emoji } : c));
        toast.success("Categoria atualizada!");
      } else {
        const cat = await createCategory(restaurantId, catForm.name, catForm.emoji);
        setCategories(prev => [...prev, cat]);
        toast.success("Categoria criada!");
      }
      setCatDialog({ open: false });
    } catch (err: any) { toast.error(err.message); }
  };

  const deleteCat = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      if (category === id) setCategory("todos");
      toast.success("Categoria removida!");
    } catch (err: any) { toast.error(err.message); }
  };

  const saveProduct = async () => {
    if (!form.name || !form.price || !restaurantId) return;
    try {
      if (editId) {
        await updateMenuItem(editId, {
          name: form.name, description: form.description,
          price: parseFloat(form.price), category_id: form.category_id || null,
          available: form.available, featured: form.featured,
          upsell: form.upsell, upsell_product_id: form.upsellProductId || null,
          upsell_message: form.upsellMessage,
        });
        setItems(prev => prev.map(p => p.id === editId ? {
          ...p, name: form.name, description: form.description,
          price: parseFloat(form.price), category_id: form.category_id || null,
          available: form.available, featured: form.featured,
          upsell: form.upsell, upsell_product_id: form.upsellProductId || null,
          upsell_message: form.upsellMessage,
        } : p));
        toast.success("Produto atualizado!");
      } else {
        const item = await createMenuItem(restaurantId, {
          name: form.name, description: form.description,
          price: parseFloat(form.price), category_id: form.category_id || null,
          available: form.available, featured: form.featured,
          upsell: form.upsell, upsell_product_id: form.upsellProductId || null,
          upsell_message: form.upsellMessage,
        });
        setItems(prev => [...prev, item]);
        toast.success("Produto criado!");
      }
      setEditOpen(false);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-4 relative pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Cardápio</h1>
        {menuSlug && (
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/menu/${menuSlug}`); toast.success("Link do cardápio copiado!"); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg bg-secondary">
            <Share2 size={12} /> Compartilhar
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 items-center">
        <button onClick={() => setCategory("todos")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === "todos" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
          Todos
        </button>
        {categories.map((c) => (
          <div key={c.id} className="relative group shrink-0">
            <button onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors pr-7 ${category === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {c.emoji || "🍽️"} {c.name}
            </button>
            {category === c.id && (
              <button onClick={() => openCatEdit(c)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center opacity-60 hover:opacity-100">
                <Settings2 size={10} />
              </button>
            )}
          </div>
        ))}
        <button onClick={openCatCreate}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground">
          + Categoria
        </button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Carregando cardápio...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product, i) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`bg-admin-card border border-admin-card-border rounded-xl overflow-hidden ${!product.available ? "opacity-60" : ""}`}>
              <div className="flex gap-3 p-3">
                <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center text-3xl shrink-0">
                  {product.image_url ? <img src={product.image_url} alt="" className="w-full h-full object-cover rounded-lg" /> : "🍽️"}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{product.name}</h3>
                      <p className="text-sm font-bold text-primary">R${product.price.toFixed(2).replace(".", ",")}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                </div>
              </div>
              <div className="px-3 pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${product.available ? "bg-status-ready" : "bg-destructive"}`} />
                    <span className="text-[11px] text-muted-foreground">{product.available ? "Disponível" : "Oculto"}</span>
                  </div>
                  <Switch checked={product.available} onCheckedChange={v => toggleField(product.id, "available", v)} className="scale-75" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame size={12} className={product.featured ? "text-primary" : "text-muted-foreground"} />
                    <span className="text-[11px] text-muted-foreground">Destaque</span>
                  </div>
                  <Switch checked={product.featured} onCheckedChange={v => toggleField(product.id, "featured", v)} className="scale-75" />
                </div>
                <p className="text-[11px] text-muted-foreground">📊 {product.sales_count || 0} vendas</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(product)} className="flex-1 h-9 text-xs border-admin-card-border text-muted-foreground">
                    <Pencil size={12} className="mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => duplicate(product)} className="h-9 text-xs border-admin-card-border text-muted-foreground">
                    <Copy size={12} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteProduct(product.id)} className="h-9 text-xs border-admin-card-border text-destructive hover:text-destructive">
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">Nenhum item encontrado</p>}
        </div>
      )}

      <button onClick={openCreate} className="fixed bottom-20 md:bottom-6 right-4 md:right-8 w-14 h-14 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center shadow-lg shadow-primary/30 transition-colors z-30">
        <Plus size={24} className="text-primary-foreground" />
      </button>

      <Dialog open={catDialog.open} onOpenChange={o => setCatDialog(p => ({ ...p, open: o }))}>
        <DialogContent className="bg-admin-card border-admin-card-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">{catDialog.edit ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Nome</Label>
              <Input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-admin-card-border h-11" placeholder="Ex: Pizzas, Bebidas..." />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Ícone</Label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setCatForm(p => ({ ...p, emoji: e }))}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${catForm.emoji === e ? "bg-primary/20 border border-primary/30" : "bg-secondary hover:bg-secondary/80"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            {catDialog.edit && (
              <Button variant="outline" onClick={() => { if (confirm("Remover esta categoria?")) deleteCat(catDialog.edit!.id); }}
                className="w-full h-10 text-xs border-red-400/20 text-red-400 hover:bg-red-400/10 rounded-xl gap-2">
                <Trash2 size={14} /> Excluir categoria
              </Button>
            )}
            <Button onClick={saveCategory} className="w-full h-11 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl">
              {catDialog.edit ? "Salvar" : "Criar categoria"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="bg-admin-nav border-admin-card-border rounded-t-2xl max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground">{editId ? "Editar produto" : "Novo produto"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="w-full h-32 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-admin-card-border">
              📷 Toque para adicionar foto
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Nome do produto</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-admin-card-border h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="bg-secondary border-admin-card-border min-h-[60px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Preço</Label>
              <Input type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="bg-secondary border-admin-card-border h-11" placeholder="R$ 0,00" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Categoria</Label>
              <Select value={form.category_id} onValueChange={v => setForm(p => ({ ...p, category_id: v }))}>
                <SelectTrigger className="bg-secondary border-admin-card-border h-11"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-admin-card border-admin-card-border">
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji || "🍽️"} {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-foreground text-sm">Disponível</Label>
              <Switch checked={form.available} onCheckedChange={v => setForm(p => ({ ...p, available: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-foreground text-sm">Destaque no cardápio</Label>
              <Switch checked={form.featured} onCheckedChange={v => setForm(p => ({ ...p, featured: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-foreground text-sm">Oferecer como upsell</Label>
              <Switch checked={form.upsell} onCheckedChange={v => setForm(p => ({ ...p, upsell: v }))} />
            </div>
            {form.upsell && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 pl-4 border-l-2 border-primary/30">
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Sugerir junto com</Label>
                  <Select value={form.upsellProductId} onValueChange={v => setForm(p => ({ ...p, upsellProductId: v }))}>
                    <SelectTrigger className="bg-secondary border-admin-card-border h-11"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-admin-card border-admin-card-border">
                      {items.filter(i => i.id !== editId).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Mensagem de upsell</Label>
                  <Textarea value={form.upsellMessage} onChange={e => setForm(p => ({ ...p, upsellMessage: e.target.value }))} className="bg-secondary border-admin-card-border min-h-[60px]" placeholder="Que tal adicionar {produto} por apenas R${preço}?" />
                </div>
              </motion.div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 h-11 border-admin-card-border text-muted-foreground rounded-xl">Cancelar</Button>
              <Button onClick={saveProduct} className="flex-1 h-11 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl">Salvar produto</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

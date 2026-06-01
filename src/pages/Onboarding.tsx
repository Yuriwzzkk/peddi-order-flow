import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Plus, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import peddiLogo from "@/assets/peddi-logo.png";
import { supabase } from "@/lib/supabase";

const TOTAL_STEPS = 10;

const cuisineOptions = [
  { emoji: "🍔", label: "Hambúrguer" },
  { emoji: "🍕", label: "Pizza" },
  { emoji: "🍣", label: "Japonês" },
  { emoji: "🥩", label: "Carnes" },
  { emoji: "🌮", label: "Mexicano" },
  { emoji: "🍗", label: "Frango" },
  { emoji: "🥗", label: "Saudável" },
  { emoji: "🍰", label: "Sobremesas" },
  { emoji: "✏️", label: "Outro" },
];

const serviceOptions = [
  { emoji: "🛵", label: "Delivery", desc: "Entrego na casa do cliente" },
  { emoji: "🏪", label: "Presencial", desc: "Cliente vem até mim" },
  { emoji: "🔀", label: "Os dois", desc: "Delivery e presencial" },
];

const categoryOptions = [
  { emoji: "🍔", label: "Lanches" },
  { emoji: "🥤", label: "Bebidas" },
  { emoji: "🍟", label: "Porções" },
  { emoji: "🎁", label: "Combos" },
  { emoji: "🥗", label: "Sobremesas" },
];

const toneOptions = [
  { emoji: "😊", label: "Amigável e descontraído", preview: "Oi! Que bom te ver por aqui! 🍔" },
  { emoji: "😎", label: "Jovem e divertido", preview: "E aí! Bora pedir? 🔥" },
  { emoji: "🎩", label: "Formal e profissional", preview: "Bem-vindo! Como posso ajudá-lo?" },
];

const weekdays = [
  { key: "seg", label: "Seg" },
  { key: "ter", label: "Ter" },
  { key: "qua", label: "Qua" },
  { key: "qui", label: "Qui" },
  { key: "sex", label: "Sex" },
  { key: "sab", label: "Sab" },
  { key: "dom", label: "Dom" },
];

interface Product {
  name: string;
  price: string;
  description: string;
  category: string;
}

interface OnboardingData {
  restaurante: string;
  culinaria: string[];
  atendimento: string;
  horario: { abre: string; fecha: string };
  dias: string[];
  categorias: string[];
  produtos: Product[];
  tomVoz: string;
  atendentes: number;
}

const defaultData: OnboardingData = {
  restaurante: "",
  culinaria: [],
  atendimento: "",
  horario: { abre: "11:00", fecha: "23:00" },
  dias: ["seg", "ter", "qua", "qui", "sex", "sab", "dom"],
  categorias: [],
  produtos: [],
  tomVoz: "",
  atendentes: 1,
};

// Confetti component
function Confetti() {
  const colors = ["#FF6B2C", "#fff", "#333", "#FF8F5C", "#FFB088"];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: colors[i % colors.length],
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: 0, rotate: p.rotation + 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "linear" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>(() => {
    const saved = localStorage.getItem("peddi_onboarding_progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultData, ...parsed.data };
      } catch { /* ignore */ }
    }
    return defaultData;
  });

  // Resume from saved step
  useEffect(() => {
    const saved = localStorage.getItem("peddi_onboarding_progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.step) setStep(parsed.step);
      } catch { /* ignore */ }
    }
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem("peddi_onboarding_progress", JSON.stringify({ step, data }));
  }, [step, data]);

  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductCat, setNewProductCat] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const canSkip = [7].includes(step); // only products step is skippable

  const handleFinish = async () => {
    try {
      const slug = data.restaurante.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { data: restaurant, error: rErr } = await supabase
        .from("restaurants")
        .insert({
          name: data.restaurante,
          slug,
          cuisine_type: data.culinaria,
          service_type: data.atendimento === "delivery" ? "delivery" : data.atendimento === "presencial" ? "presencial" : "both",
          business_hours: data.horario,
          working_days: data.dias,
          bot_tone: data.tomVoz,
          plan: "trial",
          active: true,
        })
        .select()
        .single();
      if (rErr) throw rErr;

      for (const cat of data.categorias) {
        await supabase.from("menu_categories").insert({ restaurant_id: restaurant.id, name: cat, emoji: "🍽️" });
      }
      for (const prod of data.produtos) {
        if (!prod.name || !prod.price) continue;
        const { data: cat } = await supabase.from("menu_categories")
          .select("id").eq("restaurant_id", restaurant.id).eq("name", prod.category).limit(1).maybeSingle();
        await supabase.from("menu_items").insert({
          restaurant_id: restaurant.id,
          category_id: cat?.id ?? null,
          name: prod.name,
          price: parseFloat(prod.price.replace(",", ".")) || 0,
          description: prod.description || "",
          available: true,
        });
      }

      localStorage.setItem("peddi_onboarding", JSON.stringify(data));
      localStorage.removeItem("peddi_onboarding_progress");
      toast.success("Restaurante criado com sucesso!");
      navigate("/admin");
    } catch (e: any) {
      toast.error("Erro ao criar restaurante: " + e.message);
    }
  };

  // Show confetti on final step
  useEffect(() => {
    if (step === TOTAL_STEPS) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const addProduct = () => {
    if (!newProductName || !newProductPrice) return;
    const cat = newProductCat || data.categorias[0] || "Geral";
    setData((d) => ({
      ...d,
      produtos: [...d.produtos, { name: newProductName, price: newProductPrice, description: newProductDesc, category: cat }],
    }));
    setNewProductName("");
    setNewProductPrice("");
    setNewProductDesc("");
  };

  const removeProduct = (i: number) => {
    setData((d) => ({ ...d, produtos: d.produtos.filter((_, idx) => idx !== i) }));
  };

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  const stagger = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { delay } },
  });

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center text-center gap-6 max-w-md mx-auto">
            <motion.div {...stagger(0)} className="text-6xl">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.2 }}
                className="inline-block"
              >
                🍔
              </motion.span>
            </motion.div>
            <motion.h1 {...stagger(0.3)} className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Seja bem-vindo<br />ao Peddi!
            </motion.h1>
            <motion.p {...stagger(0.5)} className="text-muted-foreground text-lg">
              Vamos configurar seu restaurante em menos de 5 minutos.
            </motion.p>
            <motion.p {...stagger(0.7)} className="text-muted-foreground">Você vai sair daqui com:</motion.p>
            <div className="flex flex-col gap-3 text-left w-full">
              {[
                "Bot do WhatsApp configurado",
                "Cardápio digital pronto",
                "Painel de pedidos ativo",
                "Atendentes cadastrados",
              ].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.3 }}
                  className="flex items-center gap-3 text-foreground"
                >
                  <span className="text-primary">✅</span>
                  <span>{item}</span>
                </motion.div>
              ))}
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
              onClick={goNext}
              className="mt-4 w-full max-w-xs px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-[0.97] transition-all"
            >
              Vamos começar →
            </motion.button>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center text-center gap-6 max-w-md mx-auto">
            <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-5xl">🏪</motion.div>
            <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Qual o nome<br />do seu restaurante?
            </motion.h1>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="w-full">
              <input
                autoFocus
                value={data.restaurante}
                onChange={(e) => setData((d) => ({ ...d, restaurante: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && data.restaurante && goNext()}
                placeholder="ex: Burger House, La Pizza, Sushi Mania"
                className="w-full px-5 py-4 rounded-xl text-lg text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors"
                style={{
                  background: "#1A1A1A",
                  border: data.restaurante ? "2px solid hsl(18 100% 58%)" : "1px solid #2A2A2A",
                }}
              />
            </motion.div>
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              onClick={goNext}
              disabled={!data.restaurante}
              className="mt-2 w-full max-w-xs px-8 py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:brightness-110"
            >
              Continuar →
            </motion.button>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col items-center text-center gap-6 max-w-lg mx-auto">
            <motion.div {...stagger(0)} className="text-5xl">🍽️</motion.div>
            <motion.h1 {...stagger(0.1)} className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Que tipo de comida<br />você serve?
            </motion.h1>
            <div className="grid grid-cols-3 gap-3 w-full">
              {cuisineOptions.map((c, i) => {
                const selected = data.culinaria.includes(c.label);
                return (
                  <motion.button
                    key={c.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    onClick={() => setData((d) => ({ ...d, culinaria: toggleArray(d.culinaria, c.label) }))}
                    className="relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                    style={{
                      background: selected ? "rgba(255,107,44,0.1)" : "#1A1A1A",
                      border: selected ? "2px solid #FF6B2C" : "1px solid #2A2A2A",
                    }}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check size={12} className="text-primary-foreground" />
                      </span>
                    )}
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-sm text-foreground">{c.label}</span>
                  </motion.button>
                );
              })}
            </div>
            <p className="text-muted-foreground text-sm">Pode selecionar mais de um</p>
            {data.culinaria.length > 0 && (
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={goNext}
                className="w-full max-w-xs px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-[0.97] transition-all"
              >
                Continuar →
              </motion.button>
            )}
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col items-center text-center gap-6 max-w-md mx-auto">
            <motion.div {...stagger(0)} className="text-5xl">🛵</motion.div>
            <motion.h1 {...stagger(0.1)} className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Como você atende<br />seus clientes?
            </motion.h1>
            <div className="flex flex-col gap-3 w-full">
              {serviceOptions.map((opt, i) => {
                const selected = data.atendimento === opt.label;
                return (
                  <motion.button
                    key={opt.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    onClick={() => {
                      setData((d) => ({ ...d, atendimento: opt.label }));
                      setTimeout(goNext, 400);
                    }}
                    className="flex items-center gap-4 p-5 rounded-xl text-left transition-all"
                    style={{
                      background: selected ? "rgba(255,107,44,0.1)" : "#1A1A1A",
                      border: selected ? "2px solid #FF6B2C" : "1px solid #2A2A2A",
                    }}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <div>
                      <p className="font-semibold text-foreground">{opt.label}</p>
                      <p className="text-sm text-muted-foreground">{opt.desc}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col items-center text-center gap-6 max-w-md mx-auto">
            <motion.div {...stagger(0)} className="text-5xl">🕐</motion.div>
            <motion.h1 {...stagger(0.1)} className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Qual seu horário<br />de funcionamento?
            </motion.h1>
            <motion.div {...stagger(0.2)} className="flex gap-6 w-full justify-center">
              <div className="flex flex-col gap-2 items-center">
                <span className="text-sm text-muted-foreground">Abre às:</span>
                <input
                  type="time"
                  value={data.horario.abre}
                  onChange={(e) => setData((d) => ({ ...d, horario: { ...d.horario, abre: e.target.value } }))}
                  className="px-4 py-3 rounded-xl text-foreground text-center text-lg outline-none"
                  style={{ background: "#1A1A1A", border: "1px solid #2A2A2A" }}
                />
              </div>
              <div className="flex flex-col gap-2 items-center">
                <span className="text-sm text-muted-foreground">Fecha às:</span>
                <input
                  type="time"
                  value={data.horario.fecha}
                  onChange={(e) => setData((d) => ({ ...d, horario: { ...d.horario, fecha: e.target.value } }))}
                  className="px-4 py-3 rounded-xl text-foreground text-center text-lg outline-none"
                  style={{ background: "#1A1A1A", border: "1px solid #2A2A2A" }}
                />
              </div>
            </motion.div>
            <motion.div {...stagger(0.3)} className="w-full">
              <p className="text-sm text-muted-foreground mb-3">Dias que funciona:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {weekdays.map((d) => {
                  const selected = data.dias.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      onClick={() => setData((prev) => ({ ...prev, dias: toggleArray(prev.dias, d.key) }))}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-[44px] min-h-[44px]"
                      style={{
                        background: selected ? "hsl(18 100% 58%)" : "#1A1A1A",
                        color: selected ? "#fff" : "#888",
                        border: selected ? "none" : "1px solid #2A2A2A",
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground/60 mt-2">Clique para desmarcar</p>
            </motion.div>
            <motion.button
              {...stagger(0.4)}
              onClick={goNext}
              className="mt-2 w-full max-w-xs px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-[0.97] transition-all"
            >
              Continuar →
            </motion.button>
          </div>
        );

      case 6:
        return (
          <div className="flex flex-col items-center text-center gap-6 max-w-lg mx-auto">
            <motion.div {...stagger(0)} className="text-5xl">🍽️</motion.div>
            <motion.h1 {...stagger(0.1)} className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Quais categorias<br />você tem no cardápio?
            </motion.h1>
            <div className="grid grid-cols-3 gap-3 w-full">
              {categoryOptions.map((c, i) => {
                const selected = data.categorias.includes(c.label);
                return (
                  <motion.button
                    key={c.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    onClick={() => setData((d) => ({ ...d, categorias: toggleArray(d.categorias, c.label) }))}
                    className="relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                    style={{
                      background: selected ? "rgba(255,107,44,0.1)" : "#1A1A1A",
                      border: selected ? "2px solid #FF6B2C" : "1px solid #2A2A2A",
                    }}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check size={12} className="text-primary-foreground" />
                      </span>
                    )}
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-sm text-foreground">{c.label}</span>
                  </motion.button>
                );
              })}
              {/* Custom category */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl"
                style={{ background: "#1A1A1A", border: "1px solid #2A2A2A" }}
              >
                {customCategory ? (
                  <>
                    <span className="text-2xl">📝</span>
                    <input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customCategory) {
                          setData((d) => ({ ...d, categorias: [...d.categorias, customCategory] }));
                          setCustomCategory("");
                        }
                      }}
                      placeholder="Nome..."
                      className="w-full text-xs text-center bg-transparent text-foreground outline-none"
                      autoFocus
                    />
                  </>
                ) : (
                  <button onClick={() => setCustomCategory(" ")} className="flex flex-col items-center gap-2">
                    <Plus size={24} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Criar</span>
                  </button>
                )}
              </motion.div>
            </div>
            <p className="text-muted-foreground text-sm">Selecione as que você tem</p>
            {data.categorias.length > 0 && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={goNext}
                className="w-full max-w-xs px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-[0.97] transition-all"
              >
                Continuar →
              </motion.button>
            )}
          </div>
        );

      case 7:
        return (
          <div className="flex flex-col items-center text-center gap-6 max-w-md mx-auto">
            <motion.div {...stagger(0)} className="text-5xl">📋</motion.div>
            <motion.h1 {...stagger(0.1)} className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Adicione seus<br />primeiros produtos
            </motion.h1>
            <motion.div {...stagger(0.2)} className="w-full p-4 rounded-xl" style={{ background: "#1A1A1A", border: "1px solid #2A2A2A" }}>
              {data.categorias.length > 0 && (
                <div className="mb-3">
                  <label className="text-xs text-muted-foreground mb-1 block text-left">Categoria</label>
                  <select
                    value={newProductCat || data.categorias[0]}
                    onChange={(e) => setNewProductCat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm text-foreground outline-none"
                    style={{ background: "#111", border: "1px solid #2A2A2A" }}
                  >
                    {data.categorias.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
              <input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Nome do produto"
                className="w-full px-3 py-3 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 outline-none mb-2"
                style={{ background: "#111", border: "1px solid #2A2A2A" }}
              />
              <div className="flex gap-2 mb-2">
                <span className="flex items-center px-3 text-sm text-muted-foreground" style={{ background: "#111", borderRadius: 8, border: "1px solid #2A2A2A" }}>R$</span>
                <input
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-3 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
                  style={{ background: "#111", border: "1px solid #2A2A2A" }}
                />
              </div>
              <input
                value={newProductDesc}
                onChange={(e) => setNewProductDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full px-3 py-3 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 outline-none mb-3"
                style={{ background: "#111", border: "1px solid #2A2A2A" }}
              />
              <button
                onClick={addProduct}
                disabled={!newProductName || !newProductPrice}
                className="w-full py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: "#2A2A2A", color: "#fff" }}
              >
                + Adicionar produto
              </button>
            </motion.div>

            {data.produtos.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-2">
                <p className="text-sm text-muted-foreground text-left">Produtos adicionados:</p>
                {data.produtos.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "#1A1A1A", border: "1px solid #2A2A2A" }}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-primary">✅</span>
                      <span className="text-foreground">{p.name}</span>
                      <span className="text-muted-foreground">· R${p.price}</span>
                    </div>
                    <button onClick={() => removeProduct(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            <p className="text-xs text-muted-foreground">Você pode adicionar mais produtos depois no painel.</p>

            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button onClick={goNext}
                className="w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-[0.97] transition-all"
              >
                Continuar →
              </button>
              <button onClick={goNext} className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                Pular por agora
              </button>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="flex flex-col items-center text-center gap-6 max-w-md mx-auto">
            <motion.div {...stagger(0)} className="text-5xl">🤖</motion.div>
            <motion.h1 {...stagger(0.1)} className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Como seu bot deve<br />falar com os clientes?
            </motion.h1>
            <div className="flex flex-col gap-3 w-full">
              {toneOptions.map((opt, i) => {
                const selected = data.tomVoz === opt.label;
                return (
                  <motion.button
                    key={opt.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    onClick={() => {
                      setData((d) => ({ ...d, tomVoz: opt.label }));
                      setTimeout(goNext, 400);
                    }}
                    className="flex items-start gap-4 p-5 rounded-xl text-left transition-all"
                    style={{
                      background: selected ? "rgba(255,107,44,0.1)" : "#1A1A1A",
                      border: selected ? "2px solid #FF6B2C" : "1px solid #2A2A2A",
                    }}
                  >
                    <span className="text-2xl mt-0.5">{opt.emoji}</span>
                    <div>
                      <p className="font-semibold text-foreground">{opt.label}</p>
                      <p className="text-sm text-muted-foreground mt-1">"{opt.preview}"</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="flex flex-col items-center text-center gap-6 max-w-md mx-auto">
            <motion.div {...stagger(0)} className="text-5xl">👥</motion.div>
            <motion.h1 {...stagger(0.1)} className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Quantas pessoas vão<br />usar o sistema?
            </motion.h1>
            <div className="grid grid-cols-4 gap-3 w-full max-w-xs">
              {[1, 2, 3, 4].map((n, i) => {
                const selected = data.atendentes === n;
                return (
                  <motion.button
                    key={n}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    onClick={() => {
                      setData((d) => ({ ...d, atendentes: n }));
                      setTimeout(goNext, 400);
                    }}
                    className="flex flex-col items-center gap-1 p-4 rounded-xl transition-all min-h-[72px]"
                    style={{
                      background: selected ? "rgba(255,107,44,0.1)" : "#1A1A1A",
                      border: selected ? "2px solid #FF6B2C" : "1px solid #2A2A2A",
                    }}
                  >
                    <span className="text-2xl font-bold text-foreground">{n === 4 ? "4+" : n}</span>
                    {n === 1 && <span className="text-[10px] text-muted-foreground">Só eu</span>}
                  </motion.button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Você pode adicionar e configurar os atendentes depois no painel</p>
          </div>
        );

      case 10:
        return (
          <div className="flex flex-col items-center text-center gap-6 max-w-md mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 12 }}
              className="text-6xl"
            >
              ✅
            </motion.div>
            <motion.h1 {...stagger(0.3)} className="font-display text-3xl md:text-4xl font-bold text-foreground">
              {data.restaurante || "Seu restaurante"} está<br />pronto para decolar! 🚀
            </motion.h1>
            <motion.p {...stagger(0.5)} className="text-muted-foreground">Configuramos para você:</motion.p>

            <div className="flex flex-col gap-4 text-left w-full">
              {[
                { icon: "🤖", title: "Bot do WhatsApp personalizado", desc: `com seu cardápio e tom ${data.tomVoz || "padrão"}` },
                { icon: "📋", title: `${data.produtos.length} produtos cadastrados`, desc: `em ${data.categorias.length} categorias` },
                { icon: "🛵", title: `Painel de ${data.atendimento || "atendimento"}`, desc: "ativo e pronto para usar" },
                { icon: "⏰", title: "Horário configurado", desc: `${data.horario.abre} às ${data.horario.fecha}` },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.2 }}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: "#1A1A1A", border: "1px solid #2A2A2A" }}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="w-full h-px my-2" style={{ background: "#2A2A2A" }} />

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, scale: [1, 1.02, 1] }}
              transition={{ delay: 1.5, scale: { repeat: Infinity, duration: 2 } }}
              onClick={handleFinish}
              className="w-full max-w-xs px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-[0.97] transition-all"
            >
              🚀 Acessar meu painel →
            </motion.button>

            <motion.p {...stagger(1.8)} className="text-xs text-muted-foreground">
              Seu período de teste gratuito termina em 3 dias.
            </motion.p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F0F0F" }}>
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 pt-4 pb-2">
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button onClick={goBack} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground">
              <ArrowLeft size={20} />
            </button>
          )}
          <img
            src={peddiLogo}
            alt="Peddi"
            className="h-8 w-auto"
            style={{ filter: "brightness(0) saturate(100%) invert(45%) sepia(96%) saturate(1500%) hue-rotate(346deg) brightness(101%) contrast(101%)" }}
          />
        </div>
        {canSkip && (
          <button onClick={goNext} className="text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            Pular etapa
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-4 md:px-8 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1A1A1A" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "#FF6B2C" }}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: "#FF6B2C" }}>{Math.round(progress)}%</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Etapa {step} de {TOTAL_STEPS}</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile fixed continue for some steps */}
      <div className="md:hidden h-4" />
    </div>
  );
}

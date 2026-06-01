import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";
import peddiLogoWhite from "@/assets/peddi-logo-white.png";
import { supabase } from "@/lib/supabase";

type Role = "owner" | "delivery" | "presencial";

const roles: { id: Role; icon: string; label: string; desc: string; route: string }[] = [
  { id: "owner", icon: "👑", label: "Dono", desc: "Painel completo", route: "/admin" },
  { id: "delivery", icon: "🛵", label: "Delivery", desc: "Entregas e conversas", route: "/delivery" },
  { id: "presencial", icon: "🧍", label: "Presencial", desc: "Pedidos no balcão", route: "/presencial" },
];

function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1200;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{value.toLocaleString("pt-BR")}{suffix}</span>;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("owner");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Usuário não encontrado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, restaurant_id")
        .eq("id", data.user.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      toast.success("Login realizado!");
      const routes: Record<string, string> = {
        owner: "/admin/dashboard",
        delivery: "/delivery/orders",
        presencial: "/presencial/new-order",
        master: "/master",
      };
      navigate(routes[profile.role] || `/${profile.role === "delivery" ? "delivery" : profile.role === "presencial" ? "presencial" : "admin"}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img src={peddiLogoWhite} alt="Peddi" className="h-10" />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {roles.map((r) => (
            <button key={r.id} onClick={() => setRole(r.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                role === r.id ? "border-primary bg-primary/10" : "border-admin-card-border bg-admin-card hover:border-primary/30"
              }`}>
              <span className="text-2xl">{r.icon}</span>
              <span className={`text-xs font-semibold ${role === r.id ? "text-primary" : "text-foreground"}`}>{r.label}</span>
              <span className="text-[10px] text-muted-foreground">{r.desc}</span>
            </button>
          ))}
        </div>

        <div className="bg-admin-card border border-admin-card-border rounded-2xl p-6 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-foreground">Entrar no painel</h1>
            <p className="text-sm text-muted-foreground">Acesse como {roles.find(r => r.id === role)?.label}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)}
                className="bg-secondary border-admin-card-border h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-foreground">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                className="bg-secondary border-admin-card-border h-11" />
            </div>
            <Button type="submit" disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 grid grid-cols-3 gap-3">
          {[
            { label: "Restaurantes", target: 2400, suffix: "+" },
            { label: "Pedidos/mês", target: 185000, suffix: "" },
            { label: "Satisfação", target: 98, suffix: "%" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 bg-admin-card/50 rounded-xl border border-admin-card-border">
              <p className="text-lg font-bold text-primary">
                <AnimatedCounter target={stat.target} suffix={stat.suffix} />
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

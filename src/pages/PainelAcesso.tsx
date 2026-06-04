import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ArrowRight } from "lucide-react";

export default function PainelAcesso() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectByRole = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (!profile) return;
    const routes: Record<string, string> = {
      owner: "/admin",
      delivery: "/delivery/pedidos",
      presencial: "/presencial",
      master: "/master",
    };
    navigate(routes[profile.role] || "/admin", { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (data.user) redirectByRole(data.user.id);
    } catch (err: any) {
      setError("Email ou senha incorretos");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0F0F0F 0%, #1A0A05 50%, #0F0F0F 100%)" }}
    >
      <div className="absolute inset-0 opacity-20" style={{
        background: "radial-gradient(circle at 50% 50%, hsl(18,100%,58%) 0%, transparent 70%)",
      }} />
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6 relative">
        <div className="text-center space-y-2">
          <p className="text-sm text-zinc-500 font-medium tracking-widest uppercase">FoodWaker</p>
          <h1 className="text-2xl font-bold text-white">Entrar</h1>
        </div>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full h-12 px-4 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full h-12 px-4 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            {loading ? "Entrando..." : <>Acessar <ArrowRight size={16} /></>}
          </button>
        </div>
        <div className="text-center">
          <a href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Voltar ao site</a>
        </div>
      </form>
    </div>
  );
}

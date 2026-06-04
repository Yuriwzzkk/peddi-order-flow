import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import peddiLogoWhite from "@/assets/peddi-logo-white.png";
import { supabase } from "@/lib/supabase";

export default function MasterLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("[LOGIN] starting fetch...");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`;
      console.log("[LOGIN] url:", url);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      console.log("[LOGIN] response status:", res.status);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.log("[LOGIN] error body:", body);
        throw new Error(body?.msg || body?.error_description || "Erro ao fazer login");
      }

      const data = await res.json();
      console.log("[LOGIN] success, role:", data.user?.user_metadata?.role);

      if (data.user?.user_metadata?.role !== "master") {
        throw new Error("Acesso restrito à equipe Foodwaker");
      }

      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      console.log("[LOGIN] setSession done");

      toast.success("Bem-vindo ao Master!");
      navigate("/master", { replace: true });
    } catch (err: any) {
      console.error("[LOGIN] error:", err);
      if (err.name === "AbortError") {
        toast.error("Login timed out. Tente novamente.");
      } else {
        toast.error(err.message || "Erro ao fazer login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <img src={peddiLogoWhite} alt="Foodwaker" className="h-8" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-primary-foreground text-sm">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="equipe@foodwaker.com"
              className="bg-white/20 border-white/30 text-white placeholder:text-white/50 h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-primary-foreground text-sm">Senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white/20 border-white/30 text-white placeholder:text-white/50 h-12 rounded-xl" />
          </div>
          <Button type="submit" disabled={loading}
            className="w-full h-12 bg-black hover:bg-black/80 text-white font-semibold rounded-xl text-base">
            {loading ? "Entrando..." : "Entrar no Foodwaker Master"}
          </Button>
        </form>

        <p className="text-center text-white/60 text-xs">Área restrita — Equipe Foodwaker</p>
      </div>
    </div>
  );
}

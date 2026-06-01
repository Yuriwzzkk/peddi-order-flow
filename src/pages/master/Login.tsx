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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (!profile || profile.role !== "master") {
        await supabase.auth.signOut();
        throw new Error("Acesso restrito à equipe Peddi");
      }

      toast.success("Bem-vindo ao Master!");
      navigate("/master");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <img src={peddiLogoWhite} alt="Peddi" className="h-8" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-primary-foreground text-sm">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="equipe@peddi.com"
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
            {loading ? "Entrando..." : "Entrar no Master"}
          </Button>
        </form>

        <p className="text-center text-white/60 text-xs">Área restrita — Equipe Peddi</p>
      </div>
    </div>
  );
}

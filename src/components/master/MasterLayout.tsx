import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Home, UtensilsCrossed, GitBranch, BarChart3, Users, Settings, Menu, X, Zap, Loader2, CreditCard, TrendingUp } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import peddiLogoWhite from "@/assets/peddi-logo-white.png";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/master", icon: Home, label: "Visão geral", end: true },
  { to: "/master/restaurantes", icon: UtensilsCrossed, label: "Restaurantes" },
  { to: "/master/assinaturas", icon: CreditCard, label: "Assinaturas" },
  { to: "/master/financeiro", icon: TrendingUp, label: "Financeiro" },
  { to: "/master/fluxos", icon: GitBranch, label: "Fluxos" },
  { to: "/master/metricas", icon: BarChart3, label: "Métricas globais" },
  { to: "/master/equipe", icon: Users, label: "Equipe Foodwaker" },
  { to: "/master/configuracoes", icon: Settings, label: "Configurações" },
];

export default function MasterLayout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/master/login", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return (
    <div className="min-h-screen bg-[hsl(0,0%,4%)] flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  if (!user) return null;

  const isActive = (path: string, end?: boolean) =>
    end ? location.pathname === path : location.pathname.startsWith(path);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-2 border-b border-border">
        <Zap size={18} className="text-primary" />
        <span className="font-display font-bold text-foreground text-sm">Foodwaker Master</span>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
            activeClassName="bg-primary/10 text-primary font-medium"
            onClick={() => setMobileOpen(false)}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">F</div>
          <div className="text-xs">
            <p className="text-foreground font-medium">Equipe Foodwaker</p>
            <p className="text-muted-foreground">Master</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(0,0%,4%)] text-foreground font-body">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-admin-nav border-r-2 border-primary/40 flex-col z-30">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-admin-nav border-b border-border flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-primary" />
          <span className="font-display font-bold text-sm">Foodwaker Master</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2">
          <Menu size={20} />
        </button>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 bg-admin-nav border-border p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="md:ml-60 pt-14 md:pt-0 min-h-screen">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

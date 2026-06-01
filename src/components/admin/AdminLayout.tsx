import { Outlet, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, MessageCircle, Users, MoreHorizontal, UtensilsCrossed, BarChart3, Bot, Settings, Bell, UsersRound, Share2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import N8nAutoTrigger from "@/components/N8nAutoTrigger";
import peddiLogoWhite from "@/assets/peddi-logo-white.png";

const mainNavItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/pedidos", icon: ClipboardList, label: "Pedidos" },
  { to: "/admin/conversas", icon: MessageCircle, label: "Conversas" },
  { to: "/admin/clientes", icon: Users, label: "Clientes" },
];

const moreNavItems = [
  { to: "/admin/cardapio", icon: UtensilsCrossed, label: "Cardápio" },
  { to: "/admin/equipe", icon: UsersRound, label: "Equipe" },
  { to: "/admin/relatorios", icon: BarChart3, label: "Relatórios" },
  { to: "/admin/automacao", icon: Bot, label: "Automação" },
  { to: "/admin/n8n", icon: Share2, label: "n8n" },
  { to: "/admin/configuracoes", icon: Settings, label: "Configurações" },
];

const allNavItems = [...mainNavItems, ...moreNavItems];

export default function AdminLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState("Admin");
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate("/admin/login");
  }, [signOut, navigate]);

  useEffect(() => {
    if (!profile?.restaurant_id) return;
    supabase.from("restaurants").select("name").eq("id", profile.restaurant_id).single().then(r => {
      if (r.data?.name) setRestaurantName(r.data.name);
    }).catch(() => {});
  }, [profile?.restaurant_id]);

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-admin-nav border-r border-admin-card-border fixed inset-y-0 left-0 z-40">
        <div className="p-4 border-b border-admin-card-border flex items-center gap-3">
          <img src={peddiLogoWhite} alt="Peddi" className="h-8" />
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {allNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive: active }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-admin-card-border">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
              {profile?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{restaurantName}</p>
              <p className="text-xs text-muted-foreground">{profile?.name || "Admin"}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-admin-nav/95 backdrop-blur-md border-b border-admin-card-border px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={peddiLogoWhite} alt="Peddi" className="h-7 md:hidden" />
            <span className="text-sm text-muted-foreground hidden sm:block">{restaurantName}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
              <Bell size={20} className="text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center">3</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">B</div>
          </div>
        </header>

        <main className="flex-1 p-4 pb-20 md:pb-4 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <N8nAutoTrigger />
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-admin-nav border-t border-admin-card-border flex items-center justify-around h-16 px-1">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            className={({ isActive: active }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 rounded-lg transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <item.icon size={22} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 rounded-lg transition-colors ${
              moreNavItems.some(i => isActive(i.to)) ? "text-primary" : "text-muted-foreground"
            }`}>
              <MoreHorizontal size={22} />
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-admin-nav border-admin-card-border rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="text-foreground">Mais opções</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 py-4">
              {moreNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive: active }) =>
                    `flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                      active
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary border-admin-card-border text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  <item.icon size={22} />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}

import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { PlusCircle, ClipboardList, CreditCard, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import N8nAutoTrigger from "@/components/N8nAutoTrigger";

const navItems = [
  { to: "/presencial", icon: PlusCircle, label: "Novo Pedido", end: true },
  { to: "/presencial/pedidos", icon: ClipboardList, label: "Pedidos" },
  { to: "/presencial/pagamentos", icon: CreditCard, label: "Pagamentos" },
];

export default function PresencialLayout() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <N8nAutoTrigger />
      <header className="sticky top-0 z-30 bg-admin-nav/95 backdrop-blur-md border-b border-admin-card-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Presencial</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground">{profile?.name || "Atendente"}</span>
          <span className="w-2 h-2 rounded-full bg-status-ready" />
          <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-foreground">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-admin-nav border-t border-admin-card-border flex items-center justify-around h-16 px-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 rounded-lg transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
            <item.icon size={22} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

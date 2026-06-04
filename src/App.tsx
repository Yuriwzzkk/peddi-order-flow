import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider, useTenant } from "@/hooks/useTenant";
import Index from "./pages/Index.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Checkout from "./pages/Checkout.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./pages/admin/Login.tsx";
import PainelAcesso from "./pages/PainelAcesso.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import Orders from "./pages/admin/Orders.tsx";
import Conversations from "./pages/admin/Conversations.tsx";
import Customers from "./pages/admin/Customers.tsx";
import MenuPage from "./pages/admin/MenuPage.tsx";
import Reports from "./pages/admin/Reports.tsx";
import Automation from "./pages/admin/Automation.tsx";
import Settings from "./pages/admin/Settings.tsx";
import Team from "./pages/admin/Team.tsx";
import AdminBilling from "./pages/admin/Billing.tsx";
import DeliveryLayout from "./components/admin/DeliveryLayout.tsx";
import DeliveryConversations from "./pages/delivery/Conversations.tsx";
import DeliveryOrders from "./pages/delivery/Orders.tsx";
import DeliveryProfile from "./pages/delivery/Profile.tsx";
import PresencialLayout from "./components/admin/PresencialLayout.tsx";
import PresencialNewOrder from "./pages/presencial/NewOrder.tsx";
import PresencialOrders from "./pages/presencial/Orders.tsx";
import PresencialPayments from "./pages/presencial/Payments.tsx";
import MasterLogin from "./pages/master/Login.tsx";
import MasterLayout from "./components/master/MasterLayout.tsx";
import MasterOverview from "./pages/master/Overview.tsx";
import MasterRestaurants from "./pages/master/Restaurants.tsx";
import MasterFlows from "./pages/master/Flows.tsx";
import MasterMetrics from "./pages/master/GlobalMetrics.tsx";
import MasterTeam from "./pages/master/FoodwakerTeam.tsx";
import MasterSettings from "./pages/master/MasterSettings.tsx";
import MasterSubscriptions from "./pages/master/Subscriptions.tsx";
import MasterFinanceiro from "./pages/master/Financeiro.tsx";
import MasterWhiteLabel from "./pages/master/WhiteLabel.tsx";
import DigitalMenu from "./pages/DigitalMenu.tsx";
import DomainNotConfigured from "./pages/DomainNotConfigured.tsx";
import Termos from "./pages/Termos.tsx";
import Privacidade from "./pages/Privacidade.tsx";
import CookieBanner from "./components/CookieBanner.tsx";
import Health from "./pages/Health.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TenantProvider>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/painel" element={<PainelAcesso />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/health" element={<Health />} />
          <Route path="/menu/:slug" element={<DigitalMenu />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pedidos" element={<Orders />} />
            <Route path="conversas" element={<Conversations />} />
            <Route path="clientes" element={<Customers />} />
            <Route path="cardapio" element={<MenuPage />} />
            <Route path="equipe" element={<Team />} />
            <Route path="relatorios" element={<Reports />} />
            <Route path="automacao" element={<Automation />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="configuracoes" element={<Settings />} />
          </Route>
          <Route path="/delivery" element={<DeliveryLayout />}>
            <Route index element={<DeliveryConversations />} />
            <Route path="pedidos" element={<DeliveryOrders />} />
            <Route path="perfil" element={<DeliveryProfile />} />
          </Route>
          <Route path="/presencial" element={<PresencialLayout />}>
            <Route index element={<PresencialNewOrder />} />
            <Route path="pedidos" element={<PresencialOrders />} />
            <Route path="pagamentos" element={<PresencialPayments />} />
          </Route>
          <Route path="/master/login" element={<MasterLogin />} />
          <Route path="/master" element={<MasterGuard><MasterLayout /></MasterGuard>}>
            <Route index element={<MasterOverview />} />
            <Route path="restaurantes" element={<MasterRestaurants />} />
            <Route path="fluxos" element={<MasterFlows />} />
            <Route path="metricas" element={<MasterMetrics />} />
            <Route path="assinaturas" element={<MasterSubscriptions />} />
            <Route path="financeiro" element={<MasterFinanceiro />} />
            <Route path="equipe" element={<MasterTeam />} />
            <Route path="whitelabel" element={<MasterWhiteLabel />} />
            <Route path="configuracoes" element={<MasterSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieBanner />
        </AuthProvider>
        </TenantProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Guard que esconde /master de quem não é master
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
function MasterGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (!profile || profile.role !== "master") {
    return <Navigate to="/painel" replace />;
  }
  return <>{children}</>;
}

// Guard que mostra página de domínio não configurado
function TenantGuard({ children }: { children: React.ReactNode }) {
  const { tenant, loading } = useTenant();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400 text-sm">Carregando...</div>
      </div>
    );
  }
  // Se houver tenant resolvido, mostra o app
  // Se não houver, mostra página de "domínio não configurado"
  // Exceção: rotas que funcionam sempre (landing, checkout, painel, master)
  const path = window.location.pathname;
  const alwaysAllowed = ["/", "/checkout", "/onboarding", "/painel", "/mestre", "/admin/login", "/master/login"];
  const isAlwaysAllowed = alwaysAllowed.some(p => path === p || path.startsWith(p + "/"));
  if (!tenant && !isAlwaysAllowed && path !== "/") {
    return <DomainNotConfigured />;
  }
  return <>{children}</>;
}

export default App;

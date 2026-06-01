import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./pages/admin/Login.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import Orders from "./pages/admin/Orders.tsx";
import Conversations from "./pages/admin/Conversations.tsx";
import Customers from "./pages/admin/Customers.tsx";
import MenuPage from "./pages/admin/MenuPage.tsx";
import Reports from "./pages/admin/Reports.tsx";
import Automation from "./pages/admin/Automation.tsx";
import N8nSettings from "./pages/admin/N8nSettings.tsx";
import Settings from "./pages/admin/Settings.tsx";
import Team from "./pages/admin/Team.tsx";
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
import MasterTeam from "./pages/master/PeddiTeam.tsx";
import MasterSettings from "./pages/master/MasterSettings.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />
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
            <Route path="n8n" element={<N8nSettings />} />
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
          <Route path="/master" element={<MasterLayout />}>
            <Route index element={<MasterOverview />} />
            <Route path="restaurantes" element={<MasterRestaurants />} />
            <Route path="fluxos" element={<MasterFlows />} />
            <Route path="metricas" element={<MasterMetrics />} />
            <Route path="equipe" element={<MasterTeam />} />
            <Route path="configuracoes" element={<MasterSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

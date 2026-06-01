// === ORDERS ===
export type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "delivery" | "completed" | "cancelled";

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  attendant_id: string | null;
  delivery_person_id: string | null;
  channel: string;
  type: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  payment_method: string | null;
  change_for: number | null;
  observation: string;
  created_at: string;
  updated_at: string | null;
}

export const statusLabels: Record<string, string> = {
  new: "Novo pedido",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Pronto",
  delivery: "Entrega",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

export const statusColors: Record<string, string> = {
  new: "bg-status-new",
  confirmed: "bg-status-confirmed",
  preparing: "bg-status-preparing",
  ready: "bg-status-ready",
  delivery: "bg-status-delivery",
  completed: "bg-status-completed",
  cancelled: "bg-destructive",
};

export const statusBorderColors: Record<string, string> = {
  new: "border-l-status-new",
  confirmed: "border-l-status-confirmed",
  preparing: "border-l-status-preparing",
  ready: "border-l-status-ready",
  delivery: "border-l-status-delivery",
  completed: "border-l-status-completed",
  cancelled: "border-l-destructive",
};

export const statusFlow: Record<OrderStatus, { next?: OrderStatus; action?: string }> = {
  new: { next: "confirmed", action: "Confirmar" },
  confirmed: { next: "preparing", action: "Preparar" },
  preparing: { next: "ready", action: "Pronto" },
  ready: { next: "delivery", action: "Enviar" },
  delivery: { next: "completed", action: "Finalizar" },
  completed: {},
  cancelled: {},
};

// === MENU ===
export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  emoji: string;
  sort_order: number;
  active: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  category_name?: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  available: boolean;
  featured: boolean;
  upsell: boolean;
  upsell_product_id: string | null;
  upsell_message: string;
  sales_count: number;
  sort_order: number;
}

// === CUSTOMERS ===
export type CustomerStatus = "recorrente" | "novo" | "inativo";

export interface Customer {
  id: string;
  restaurant_id: string;
  name: string;
  phone: string | null;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  status: CustomerStatus;
  favorites: string[];
}

// === CONVERSATIONS ===
export interface Message {
  id: string;
  conversation_id: string;
  sender: "client" | "bot" | "attendant";
  text: string;
  message_type: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  customer_name: string;
  channel: string;
  status: string;
  mode: "bot" | "attendant";
  unread_count: number;
  last_message_at: string;
  messages: Message[];
}

// === TEAM ===
export interface Attendant {
  id: string;
  restaurant_id: string;
  name: string;
  email: string | null;
  type: "delivery" | "presencial" | null;
  shift: string | null;
  online: boolean;
  ordersToday: number;
  revenueToday: number;
  lastAccess: string | null;
}

// === DASHBOARD ===
export interface DashboardStats {
  ordersToday: number;
  revenue: number;
  preparing: number;
  delivered: number;
  deliveryPct: number;
  presencialPct: number;
  paymentMethods: { method: string; pct: number }[];
  hourlyOrders: { hour: string; pedidos: number }[];
  attendants: { name: string; orders: number; revenue: number; hours: string; payment: string }[];
  recentActivity: { icon: string; text: string; time: string }[];
}

// === RESTAURANT ===
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  logo_url: string | null;
  cuisine_type: string[];
  service_type: string;
  business_hours: { abre: string; fecha: string } | null;
  working_days: string[];
  bot_tone: string;
  plan: string;
  trial_ends: string | null;
  active: boolean;
  whatsapp_number: string | null;
  billing_email: string | null;
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// === AUTOMATION ===
export interface FlowStep {
  icon: string;
  label: string;
  message?: string;
  editable?: boolean;
  branches?: { yes: string; no: string };
}

export interface FlowDetail {
  steps: FlowStep[];
  stats: { triggered: number; responded?: number; ordered?: number; revenue?: string };
}

export interface OwnerFlow {
  id: string;
  icon: string;
  name: string;
  description: string;
  active: boolean;
  stat: string;
  detail?: FlowDetail;
}

// === FLOW ENGINE ===
export interface FlowBlock {
  id: string;
  flow_id: string;
  block_type: string;
  title: string;
  icon: string;
  message: string;
  config: Record<string, unknown>;
  position_x: number;
  position_y: number;
}

export interface FlowConnection {
  id: string;
  flow_id: string;
  from_block_id: string;
  to_block_id: string;
  label: string | null;
}

export interface ConversationFlowState {
  id: string;
  conversation_id: string;
  flow_id: string;
  current_block_id: string | null;
  status: "active" | "paused" | "completed" | "cancelled";
  variables: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
}

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  config: Record<string, unknown>;
  blocks: FlowBlock[];
  connections: FlowConnection[];
  is_premium: boolean;
}

// === NOTIFICATIONS ===
export interface Notification {
  id: string;
  restaurant_id: string;
  conversation_id: string | null;
  recipient_phone: string;
  message: string;
  notification_type: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  sent_at: string | null;
  error: string | null;
  created_at: string;
}

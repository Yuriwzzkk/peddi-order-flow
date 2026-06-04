import { supabase } from "@/lib/supabase";

type N8nActionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

/**
 * Dispatch an event to n8n via the n8n-webhook edge function.
 * This triggers the configured webhooks for the given event.
 */
export async function triggerN8nEvent(
  restaurantId: string,
  event: string,
  payload?: Record<string, unknown>
): Promise<N8nActionResult> {
  try {
    const { data, error } = await supabase.functions.invoke("n8n-webhook", {
      body: {
        action: "trigger_event",
        restaurant_id: restaurantId,
        event,
        ...payload,
      },
    });
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update a session's stage and state (called by n8n callback or frontend)
 */
export async function updateSession(
  sessionId: string,
  updates: {
    etapa_atual?: string;
    carrinho?: unknown[];
    status?: string;
    bump_ofertado?: boolean;
    upsell_ofertado?: boolean;
    downsell_ofertado?: boolean;
  }
): Promise<N8nActionResult> {
  try {
    const { data, error } = await supabase.functions.invoke("n8n-webhook", {
      body: {
        action: "update_session",
        session_id: sessionId,
        ...updates,
      },
    });
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Create a new customer session
 */
export async function createSession(
  restauranteId: string,
  clienteId: string
): Promise<N8nActionResult & { session_id?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("n8n-webhook", {
      body: {
        action: "create_session",
        restaurante_id: restauranteId,
        cliente_id: clienteId,
      },
    });
    if (error) throw error;
    return { success: true, session_id: (data as any)?.session_id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Send a WhatsApp message via Z-API through the edge function
 */
export async function sendWhatsAppMessage(
  restauranteId: string,
  telefone: string,
  message: string
): Promise<N8nActionResult> {
  try {
    const { data, error } = await supabase.functions.invoke("n8n-webhook", {
      body: {
        action: "send_message",
        restaurante_id: restauranteId,
        telefone,
        message,
      },
    });
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Create an order via n8n (full pipeline: handoff)
 */
export async function createOrderViaN8n(
  restauranteId: string,
  orderData: {
    cliente_id: string;
    itens: unknown[];
    total: number;
    tipo?: string;
    endereco?: string;
    pagamento?: string;
    troco?: string;
    bumps?: unknown[];
  }
): Promise<N8nActionResult & { pedido_id?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("n8n-webhook", {
      body: {
        action: "create_order",
        restaurante_id: restauranteId,
        ...orderData,
      },
    });
    if (error) throw error;
    return { success: true, pedido_id: (data as any)?.pedido_id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get restaurant data (for n8n flow validation)
 */
export async function getRestaurantForN8n(
  restaurantId: string
): Promise<N8nActionResult> {
  try {
    const { data, error } = await supabase.functions.invoke("n8n-webhook", {
      body: {
        action: "get_restaurant",
        restaurant_id: restaurantId,
      },
    });
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get menu items (for n8n flow)
 */
export async function getMenuForN8n(
  restaurantId: string,
  categoria?: string
): Promise<N8nActionResult> {
  try {
    const { data, error } = await supabase.functions.invoke("n8n-webhook", {
      body: {
        action: "get_menu",
        restaurante_id: restaurantId,
        categoria,
      },
    });
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get customer by phone
 */
export async function getCliente(
  restaurantId: string,
  telefone: string
): Promise<N8nActionResult> {
  try {
    const { data, error } = await supabase.functions.invoke("n8n-webhook", {
      body: {
        action: "get_cliente",
        restaurante_id: restaurantId,
        telefone,
      },
    });
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Create or update customer
 */
export async function upsertCliente(
  restaurantId: string,
  data: {
    telefone: string;
    nome?: string;
    endereco_padrao?: string;
  }
): Promise<N8nActionResult> {
  try {
    const { data: result, error } = await supabase.functions.invoke("n8n-webhook", {
      body: {
        action: "upsert_cliente",
        restaurante_id: restaurantId,
        ...data,
      },
    });
    if (error) throw error;
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get all n8n workflow JSON filenames available for import
 */
export function getAvailableWorkflowExports(): {
  id: string;
  name: string;
  file: string;
}[] {
  return [
    { id: "fluxo-principal", name: "Fluxo Principal de Vendas", file: "/n8n-workflows/fluxo-principal.json" },
    { id: "carrinho-abandonado", name: "Carrinho Abandonado (15min)", file: "/n8n-workflows/carrinho-abandonado.json" },
    { id: "reengajamento", name: "Reengajamento (7 dias)", file: "/n8n-workflows/reengajamento.json" },
    { id: "avaliacao-pos-entrega", name: "Avaliação Pós-Entrega (NPS)", file: "/n8n-workflows/avaliacao-pos-entrega.json" },
    { id: "abertura-fechamento", name: "Abertura/Fechamento Automático", file: "/n8n-workflows/abertura-fechamento.json" },
  ];
}

/**
 * Fetch n8n workflow JSON by id
 */
export async function fetchWorkflowExport(id: string): Promise<Record<string, unknown> | null> {
  const workflows = getAvailableWorkflowExports();
  const wf = workflows.find(w => w.id === id);
  if (!wf) return null;
  try {
    const res = await fetch(wf.file);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

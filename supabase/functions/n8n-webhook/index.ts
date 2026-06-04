import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, restaurant_id, ...payload } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper: query automation_flow_state (aliased as session for n8n)
    const getSession = (sessionId: string) =>
      supabase.from("conversation_flow_state").select("*").eq("id", sessionId).single();

    const updateSession = (sessionId: string, updates: Record<string, unknown>) =>
      supabase
        .from("conversation_flow_state")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", sessionId);

    const createSession = (restaurantId: string, customerId: string) =>
      supabase
        .from("conversation_flow_state")
        .insert({
          restaurant_id: restaurantId,
          customer_id: customerId,
          current_block: "start",
          state: {},
        })
        .select()
        .single();

    const getActiveSessions = (rId: string) =>
      supabase
        .from("conversation_flow_state")
        .select("*, customers(name, phone)")
        .eq("restaurant_id", rId)
        .neq("current_block", "completed");

    const expireStaleSessions = (rId: string, beforeIso: string) =>
      supabase
        .from("conversation_flow_state")
        .update({ current_block: "expired", state: { reason: "timeout" } })
        .eq("restaurant_id", rId)
        .neq("current_block", "completed")
        .lt("updated_at", beforeIso);

    switch (action) {
      // ── DISPATCH EVENT TO N8N WEBHOOKS ──
      case "trigger_event": {
        const { event, entity_id, data } = payload;
        if (!event) throw new Error("Missing event field");

        const { data: webhooks, error } = await supabase
          .from("n8n_webhooks")
          .select("*")
          .eq("restaurant_id", restaurant_id)
          .eq("trigger_event", event)
          .eq("active", true);

        if (error) throw error;
        if (!webhooks?.length) {
          return new Response(JSON.stringify({ dispatched: 0 }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const results = [];
        for (const wh of webhooks) {
          try {
            const res = await fetch(wh.webhook_url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(wh.headers || {}),
              },
              body: JSON.stringify({
                event,
                restaurant_id,
                entity_id,
                data: data || {},
                timestamp: new Date().toISOString(),
              }),
            });

            await supabase
              .from("n8n_webhooks")
              .update({ last_triggered_at: new Date().toISOString() })
              .eq("id", wh.id);

            results.push({ webhook_id: wh.id, status: res.status });
          } catch (e: any) {
            results.push({ webhook_id: wh.id, status: "error", error: e.message });
          }
        }

        return new Response(JSON.stringify({ dispatched: results.length, results }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── UPDATE SESSION (n8n callback) ──
      case "update_session": {
        const {
          session_id,
          current_block,
          state,
          customer_id,
          conversation_id,
        } = payload;
        if (!session_id) throw new Error("Missing session_id");

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (current_block !== undefined) updates.current_block = current_block;
        if (state !== undefined) updates.state = state;
        if (customer_id !== undefined) updates.customer_id = customer_id;
        if (conversation_id !== undefined) updates.conversation_id = conversation_id;

        const { error } = await updateSession(session_id, updates);
        if (error) throw error;

        return new Response(JSON.stringify({ updated: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── CREATE SESSION (n8n callback) ──
      case "create_session": {
        const { customer_id, restaurant_id: rId } = payload;
        if (!customer_id || !rId) throw new Error("Missing customer_id or restaurant_id");

        const { data: session, error } = await createSession(rId, customer_id);
        if (error) throw error;

        return new Response(JSON.stringify({ session_id: session.id }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── SEND WHATSAPP MESSAGE (n8n callback) ──
      case "send_message": {
        const { phone, message, conversation_id } = payload;
        if (!phone || !message) throw new Error("Missing phone or message");

        const { data: zapiConfig } = await supabase
          .from("zapi_config")
          .select("*")
          .eq("restaurant_id", restaurant_id)
          .eq("active", true)
          .maybeSingle();

        if (zapiConfig?.instance_id && zapiConfig?.api_token) {
          try {
            const zapiRes = await fetch(
              `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.api_token}/send-text`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, message }),
              }
            );
            if (!zapiRes.ok) {
              console.error("Z-API error:", await zapiRes.text());
            }
          } catch (e) {
            console.error("Z-API fetch error:", e);
          }
        }

        // Always record in queue for audit
        await supabase.from("whatsapp_notification_queue").insert({
          restaurant_id,
          conversation_id: conversation_id || null,
          recipient_phone: phone,
          message,
          notification_type: "n8n_callback",
          metadata: { source: "n8n-webhook" },
        });

        return new Response(JSON.stringify({ sent: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── CREATE ORDER (n8n callback) ──
      case "create_order": {
        const {
          customer_id: cId,
          restaurant_id: rId,
          items,
          total,
          type,
          delivery_address,
          payment_method,
          change_for,
          notes,
        } = payload;
        if (!cId || !rId || !items?.length) throw new Error("Missing required order fields");

        const { data, error } = await supabase.rpc("create_order_with_items_safe", {
          p_restaurant_id: rId,
          p_customer_id: cId,
          p_type: type || "delivery",
          p_channel: "whatsapp",
          p_items: items,
          p_notes: notes || "",
          p_delivery_address: delivery_address || null,
          p_payment_method: payment_method || null,
          p_change_for: change_for || null,
        });

        if (error) throw error;
        return new Response(JSON.stringify({ order_id: data?.order?.id, ...data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── GET RESTAURANT ──
      case "get_restaurant": {
        const { data: restaurant, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", restaurant_id)
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(restaurant), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── GET MENU ──
      case "get_menu": {
        const { category_id } = payload;
        let query = supabase
          .from("menu_items")
          .select("*, menu_categories(name)")
          .eq("restaurant_id", restaurant_id)
          .eq("available", true);

        if (category_id) query = query.eq("category_id", category_id);

        const { data, error } = await query.order("name");
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── GET CUSTOMER BY PHONE ──
      case "get_customer": {
        const { phone } = payload;
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("phone", phone)
          .eq("restaurant_id", restaurant_id)
          .maybeSingle();

        if (error) throw error;
        return new Response(JSON.stringify(data || null), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── UPSERT CUSTOMER ──
      case "upsert_customer": {
        const { phone, name, address } = payload;
        if (!phone) throw new Error("Missing phone");

        const { data: existing } = await supabase
          .from("customers")
          .select("id")
          .eq("phone", phone)
          .eq("restaurant_id", restaurant_id)
          .maybeSingle();

        if (existing) {
          const updates: Record<string, unknown> = { last_order_at: new Date().toISOString() };
          if (name) updates.name = name;
          if (address) updates.address = address;
          await supabase.from("customers").update(updates).eq("id", existing.id);
        } else {
          await supabase.from("customers").insert({
            restaurant_id,
            phone,
            name: name || phone,
            address: address || null,
            status: "novo",
          });
        }

        return new Response(JSON.stringify({ upserted: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── UPDATE ORDER STATUS ──
      case "update_order_status": {
        const { order_id, status: newStatus } = payload;
        if (!order_id || !newStatus) throw new Error("Missing order_id or status");

        const { error } = await supabase.rpc("update_order_status", {
          p_order_id: order_id,
          p_new_status: newStatus,
        });

        if (error) throw error;
        return new Response(JSON.stringify({ updated: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── GET ACTIVE SESSIONS ──
      case "get_active_sessions": {
        const { data, error } = await getActiveSessions(restaurant_id);
        if (error) throw error;
        return new Response(JSON.stringify(data || []), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── EXPIRE STALE SESSIONS ──
      case "expire_stale_sessions": {
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data, error } = await expireStaleSessions(restaurant_id, thirtyMinAgo);
        if (error) throw error;
        return new Response(JSON.stringify({ expired: data?.length || 0 }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── LEGACY ALIASES (for backward compat with old n8n flows) ──
      case "update_pedido_status": return handleUpdateOrderStatus(payload, restaurant_id);
      case "create_pedido": return await handleCreateOrder(payload);
      case "get_cliente": return await handleGetCustomer(payload, restaurant_id);
      case "upsert_cliente": return await handleUpsertCustomer(payload, restaurant_id);
      case "get_cardapio": return await handleGetMenu(restaurant_id, payload);
      case "get_restaurante": return await handleGetRestaurant(restaurant_id);

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleUpdateOrderStatus(payload: any, restaurant_id: string) {
  const { pedido_id, status: newStatus } = payload;
  if (!pedido_id || !newStatus) throw new Error("Missing pedido_id or status");
  const { error } = await supabase.rpc("update_order_status", {
    p_order_id: pedido_id,
    p_new_status: newStatus,
  });
  if (error) throw error;
  return new Response(JSON.stringify({ updated: true, legacy: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

async function handleCreateOrder(payload: any) {
  const { cliente_id, restaurante_id, itens, total, tipo, endereco, pagamento, troco } = payload;
  if (!cliente_id || !restaurante_id || !itens?.length) throw new Error("Missing fields");
  const { data, error } = await supabase.rpc("create_order_with_items_safe", {
    p_restaurant_id: restaurante_id,
    p_customer_id: cliente_id,
    p_type: tipo || "delivery",
    p_channel: "whatsapp",
    p_items: Array.isArray(itens) ? itens : [],
    p_delivery_address: endereco || null,
    p_payment_method: pagamento || null,
    p_change_for: troco || null,
  });
  if (error) throw error;
  return new Response(JSON.stringify({ pedido_id: data?.order?.id, legacy: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

async function handleGetCustomer(payload: any, restaurant_id: string) {
  const { telefone } = payload;
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("phone", telefone)
    .eq("restaurant_id", restaurant_id)
    .maybeSingle();
  if (error) throw error;
  return new Response(JSON.stringify(data || null), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

async function handleUpsertCustomer(payload: any, restaurant_id: string) {
  const { telefone, nome, endereco_padrao } = payload;
  if (!telefone) throw new Error("Missing telefone");
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", telefone)
    .eq("restaurant_id", restaurant_id)
    .maybeSingle();
  if (existing) {
    const u: Record<string, unknown> = { last_order_at: new Date().toISOString() };
    if (nome) u.name = nome;
    if (endereco_padrao) u.address = endereco_padrao;
    await supabase.from("customers").update(u).eq("id", existing.id);
  } else {
    await supabase.from("customers").insert({
      restaurant_id, phone: telefone, name: nome || telefone,
      address: endereco_padrao || null, status: "novo",
    });
  }
  return new Response(JSON.stringify({ upserted: true, legacy: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

async function handleGetMenu(restaurant_id: string, payload: any) {
  const { categoria } = payload;
  let query = supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurant_id)
    .eq("available", true);
  if (categoria) query = query.eq("category_id", categoria);
  const { data, error } = await query.order("name");
  if (error) throw error;
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

async function handleGetRestaurant(restaurant_id: string) {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurant_id)
    .single();
  if (error) throw error;
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

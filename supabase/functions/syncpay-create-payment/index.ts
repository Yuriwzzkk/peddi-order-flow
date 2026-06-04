// Edge function: syncpay-create-payment
// Cria um pagamento PIX via SyncPay e registra no banco
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const SYNCPAY_CLIENT_ID = Deno.env.get("SYNCPAY_CLIENT_ID") || "9bd9d69c-d42f-4d7d-936d-5c51226f84a7";
const SYNCPAY_CLIENT_SECRET = Deno.env.get("SYNCPAY_CLIENT_SECRET") || "d86751e8-7c2f-4526-ba19-f831cdc61fe0";
const SYNCPAY_BASE_URL = Deno.env.get("SYNCPAY_BASE_URL") || "https://api.syncpayments.com.br";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://foodwaker.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-signature",
  "Access-Control-Max-Age": "86400",
};

// Cache do token (válido por 1h)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getSyncPayToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }
  const res = await fetch(`${SYNCPAY_BASE_URL}/api/partner/v1/auth-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: SYNCPAY_CLIENT_ID,
      client_secret: SYNCPAY_CLIENT_SECRET,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Falha ao gerar token SyncPay: ${res.status} - ${txt}`);
  }
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: new Date(data.expires_at).getTime(),
  };
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_cpf,
      restaurant_name,
      plan = "pro",
    } = body;

    if (!customer_name || !customer_email || !customer_phone || !customer_cpf || !restaurant_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validar CPF (apenas dígitos, 11 chars)
    const cpfClean = customer_cpf.replace(/\D/g, "");
    if (cpfClean.length !== 11) {
      return new Response(JSON.stringify({ error: "CPF inválido (deve ter 11 dígitos)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Validar phone (10-11 dígitos)
    const phoneClean = customer_phone.replace(/\D/g, "");
    if (phoneClean.length < 10 || phoneClean.length > 11) {
      return new Response(JSON.stringify({ error: "Telefone inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Definir valor por plano
    const amounts: Record<string, number> = { starter: 97, pro: 197 };
    const amount = amounts[plan] || 197;

    // Gerar slug
    const slug = restaurant_name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);

    // Gerar token SyncPay
    const token = await getSyncPayToken();

    // Criar cashin
    const cashinRes = await fetch(`${SYNCPAY_BASE_URL}/api/partner/v1/cash-in`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        description: `Peddi ${plan.toUpperCase()} - ${restaurant_name}`,
        webhook_url: `${APP_BASE_URL}/functions/v1/syncpay-webhook`,
        client: {
          name: customer_name,
          cpf: cpfClean,
          email: customer_email,
          phone: phoneClean,
        },
      }),
    });

    if (!cashinRes.ok) {
      const errText = await cashinRes.text();
      throw new Error(`SyncPay cashin falhou: ${cashinRes.status} - ${errText}`);
    }
    const cashinData = await cashinRes.json();

    // Salvar payment_intent no banco
    const { data: payment, error: dbErr } = await supabase
      .from("payment_intents")
      .insert({
        identifier: cashinData.identifier,
        customer_name,
        customer_email,
        customer_phone: phoneClean,
        customer_cpf: cpfClean,
        restaurant_name,
        restaurant_slug: slug,
        plan,
        amount,
        pix_code: cashinData.pix_code,
        status: "pending",
      })
      .select()
      .single();

    if (dbErr) throw dbErr;

    return new Response(JSON.stringify({
      success: true,
      payment_id: payment.id,
      identifier: cashinData.identifier,
      pix_code: cashinData.pix_code,
      amount,
      expires_in_minutes: 30,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

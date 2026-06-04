// Edge function: syncpay-webhook
// Recebe webhooks da SyncPay com validação de assinatura HMAC-SHA256
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { newPaymentEmail } from "../_shared/email-templates.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const WEBHOOK_SECRET = Deno.env.get("SYNCPAY_WEBHOOK_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-signature",
};

/**
 * Valida assinatura HMAC-SHA256 do webhook SyncPay.
 * SyncPay envia o header `x-webhook-signature` (ou `x-signature`) com HMAC do body.
 * Comparação em tempo constante para evitar timing attacks.
 */
async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const expected = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    // Suporta ambos formatos: hex puro e "sha256=hex"
    const received = signature.replace(/^sha256=/, "").toLowerCase();
    if (received.length !== expected.length) return false;
    let result = 0;
    for (let i = 0; i < received.length; i++) {
      result |= received.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return result === 0;
  } catch {
    return false;
  }
}

async function sendEmailToMaster(payment: any) {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY não configurada, pulando email");
    return;
  }
  const { data: settings } = await supabase
    .from("saas_settings")
    .select("value")
    .eq("key", "master_email")
    .maybeSingle();
  const masterEmail =
    (settings?.value as any)?.replace(/"/g, "") || "master@peddi.com.br";

  const html = newPaymentEmail({
    restaurant_name: payment.restaurant_name,
    restaurant_slug: payment.restaurant_slug,
    plan: payment.plan || "starter",
    amount: Number(payment.amount) || 97,
    customer_name: payment.customer_name,
    customer_email: payment.customer_email,
    customer_phone: payment.customer_phone,
    customer_cpf: payment.customer_cpf,
    config_url: "https://app.foodwaker.app/master/whitelabel",
  });

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Peddi <noreply@foodwaker.app>",
        to: masterEmail,
        subject: `🎉 Novo pagamento: ${payment.restaurant_name} (R$ ${payment.amount})`,
        html,
      }),
    });
  } catch (e) {
    console.error("Falha ao enviar email:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Ler body raw para validação HMAC
    const rawBody = await req.text();

    // ========== VALIDAÇÃO DE ASSINATURA ==========
    // Aceita em modo "permissivo" se SYNCPAY_WEBHOOK_SECRET não estiver configurado
    // (apenas em dev). Em produção, secret é obrigatório.
    const signature =
      req.headers.get("x-webhook-signature") ||
      req.headers.get("x-signature") ||
      req.headers.get("x-hub-signature-256");

    if (WEBHOOK_SECRET) {
      const valid = await verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET);
      if (!valid) {
        console.warn("Assinatura inválida. Signature:", signature);
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.warn("SYNCPAY_WEBHOOK_SECRET não configurado — webhook sem validação. Configure em produção!");
    }

    const payload = JSON.parse(rawBody);
    console.log("SyncPay webhook payload:", JSON.stringify(payload));

    const identifier = payload?.data?.identifier || payload?.identifier;
    const status = payload?.data?.status || payload?.status;

    if (!identifier) {
      return new Response(
        JSON.stringify({ error: "identifier not found in payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let mappedStatus: "paid" | "failed" | "expired" | "refunded" = "pending";
    if (status === "PAID" || status === "paid" || status === "APPROVED" || status === "approved") {
      mappedStatus = "paid";
    } else if (status === "FAILED" || status === "failed" || status === "CANCELED" || status === "canceled") {
      mappedStatus = "failed";
    } else if (status === "EXPIRED" || status === "expired") {
      mappedStatus = "expired";
    } else if (status === "REFUNDED" || status === "refunded") {
      mappedStatus = "refunded";
    }

    const { data: payment, error } = await supabase.rpc(
      "update_payment_intent_status",
      {
        p_identifier: identifier,
        p_status: mappedStatus,
        p_webhook_data: payload,
      }
    );

    if (error) {
      console.error("DB error:", error);
      throw error;
    }

    if (mappedStatus === "paid" && payment) {
      await sendEmailToMaster(payment);

      // Cria subscription (MRR tracking). Idempotente: se já existir,
      // a função retorna o ID da existente.
      try {
        const { data: subId, error: subError } = await supabase.rpc(
          "create_subscription_from_payment",
          { p_payment_intent_id: payment.id }
        );
        if (subError) {
          console.error("Erro ao criar subscription:", subError);
        } else {
          console.log("Subscription criada:", subId);
        }
      } catch (e) {
        console.error("Falha ao criar subscription:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, payment }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

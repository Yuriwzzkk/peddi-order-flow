import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { welcomeEmail } from "../_shared/email-templates.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendKey = Deno.env.get("RESEND_API_KEY") || "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      restaurant_id,
      admin_email,
      admin_password,
      brand_name,
      logo_url,
      logo_path,
      primary_color,
      background_color,
      sidebar_color,
      domain_type,
      custom_domain,
    } = await req.json();

    if (!restaurant_id || !admin_email || !admin_password) {
      return new Response(JSON.stringify({ error: "Missing required fields: restaurant_id, admin_email, admin_password" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Buscar restaurante
    const { data: restaurant, error: rErr } = await supabase
      .from("restaurants")
      .select("id, name, slug, white_label, painel_configurado, active")
      .eq("id", restaurant_id)
      .single();

    if (rErr || !restaurant) {
      throw new Error("Restaurante nao encontrado");
    }

    // 2. Montar white_label config
    const whiteLabel = {
      brand_name: brand_name || restaurant.name,
      logo_url: logo_url || "",
      logo_path: logo_path || "",
      primary_color: primary_color || "#6C5CE7",
      background_color: background_color || "#0f0f0f",
      sidebar_color: sidebar_color || "#141414",
      domain_type: domain_type || "subdominio",
      custom_domain: custom_domain || "",
      configured: true,
      configured_at: new Date().toISOString(),
    };

    // 3. Gerar link do painel
    const subdomain = restaurant.slug || restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const panelUrl = domain_type === "proprio" && custom_domain
      ? `https://${custom_domain}`
      : `https://${subdomain}.foodwaker.app`;

    // 4. Criar ou atualizar admin profile
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("restaurant_id", restaurant_id)
      .eq("role", "admin")
      .maybeSingle();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.id;
      // Update password via auth admin API
      await supabase.auth.admin.updateUserById(userId, { password: admin_password });
    } else {
      // Use create_peddi_user function (creates user with proper tokens, no NULL bug)
      const { data: newUserId, error: rpcErr } = await supabase.rpc("create_peddi_user", {
        p_email: admin_email,
        p_password: admin_password,
        p_name: `Admin ${restaurant.name}`,
        p_role: "owner", // admin = owner in our schema
        p_restaurant_id: restaurant_id,
        p_type: null,
        p_phone: null,
      });

      if (rpcErr) {
        // Fallback: use auth.admin.createUser (may have NULL token bug)
        console.warn("create_peddi_user falhou, usando fallback:", rpcErr.message);
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: admin_email,
          password: admin_password,
          email_confirm: true,
          user_metadata: { name: `Admin ${restaurant.name}`, role: "owner", restaurant_id },
        });
        if (createErr) throw createErr;
        userId = newUser!.user!.id;
        await supabase.from("profiles").upsert({
          id: userId,
          restaurant_id,
          name: `Admin ${restaurant.name}`,
          email: admin_email,
          role: "owner",
          online: false,
        }, { onConflict: "id" });
      } else {
        userId = newUserId;
      }
    }

    // 5. Salvar white_label + admin_email + painel_configurado no restaurante
    const { error: uErr } = await supabase
      .from("restaurants")
      .update({
        white_label: whiteLabel,
        admin_email,
        custom_domain: custom_domain || null,
        painel_configurado: true,
      })
      .eq("id", restaurant_id);

    if (uErr) throw uErr;

    // 6. Enviar email de boas-vindas
    let emailSent = false;
    if (resendKey) {
      try {
        const emailHtml = welcomeEmail({
          brand_name: brand_name || restaurant.name,
          primary_color: primary_color || "#6C5CE7",
          restaurant_name: restaurant.name,
          panel_url: panelUrl,
          admin_email,
          admin_password,
        });

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Foodwaker <noreply@foodwaker.app>",
            to: admin_email,
            subject: `🎉 Painel ${restaurant.name} configurado! Seus dados de acesso`,
            html: emailHtml,
          }),
        });
        emailSent = res.ok;
        if (!res.ok) {
          const errText = await res.text();
          console.error("Resend error:", errText);
        }
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      panel_url: panelUrl,
      email_sent: emailSent,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

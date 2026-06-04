import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    const { email, password, name, role, restaurant_id, type, shift } = await req.json();

    if (!email || !password || !name || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields: email, password, name, role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userId: string;

    // Try to create the auth user
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, restaurant_id: restaurant_id || null },
    });

    if (createError && createError.message.includes("already been registered")) {
      // User already exists — look up their ID from profiles
      const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
      if (existing?.id) {
        userId = existing.id;
      } else {
        // Try to find in auth.users via listUsers (pagination may be needed)
        const { data: usersPage } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
        const found = usersPage?.users?.find(u => u.email === email);
        if (!found?.id) throw new Error("Usuário já existe mas não foi possível encontrar o ID");
        userId = found.id;
      }
    } else if (createError) {
      throw createError;
    } else {
      userId = user!.user!.id;
    }

    // Upsert the profile (works for both new and existing users)
    const profileData: Record<string, unknown> = {
      id: userId,
      restaurant_id: restaurant_id || null,
      name,
      email,
      role,
      type: (type && ["delivery", "presencial"].includes(type)) ? type : null,
      shift: shift || null,
      online: false,
    };

    const { error: profileError } = await supabase.from("profiles").upsert(profileData, { onConflict: "id" });
    if (profileError) throw profileError;

    return new Response(JSON.stringify({
      user_id: userId,
      email,
      name,
      role,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

serve(async (req) => {
  try {
    const { email, password, name, role, restaurant_id, type, shift } = await req.json();

    if (!email || !password || !name || !role || !restaurant_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, restaurant_id },
    });

    if (createError) throw createError;
    if (!user?.user?.id) throw new Error("User creation failed");

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.user.id,
      restaurant_id,
      name,
      email,
      role,
      type: type || null,
      shift: shift || null,
      online: false,
    });

    if (profileError) throw profileError;

    return new Response(JSON.stringify({
      user_id: user.user.id,
      email,
      name,
      role,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});

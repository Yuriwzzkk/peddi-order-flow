// Edge function: apply-migration
// Roda SQL de migração de forma segura (apenas com token de master)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MASTER_TOKEN = Deno.env.get("MASTER_MIGRATION_TOKEN") || "peddi-master-migration-2026";

const supabase = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-master-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const token = req.headers.get("x-master-token");
  if (token !== MASTER_TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { sql, migration_name } = await req.json();
    if (!sql) {
      return new Response(JSON.stringify({ error: "SQL required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Usar rpc exec_sql se existir, senão tentar com psql via Deno
    // Vamos tentar executar via direct query
    const { data, error } = await supabase.rpc("exec_sql", { sql_text: sql });

    if (error) {
      return new Response(JSON.stringify({
        error: "exec_sql function not available. Use supabase db push instead.",
        hint: "This function requires a custom exec_sql RPC to be created first."
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, migration: migration_name, data }), {
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

// Endpoint público de health check
// Acesse /health para verificar status do app e conectividade com Supabase
import { useEffect, useState } from "react";
import { Activity, Database, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function Health() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const checks: Record<string, any> = {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      };
      let healthy = true;

      // Check Supabase
      try {
        const start = Date.now();
        const { error } = await fetch(
          "https://sqclpeyoimddjcrfcrmi.supabase.co/rest/v1/restaurants?select=count&limit=1",
          { headers: { apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxY2xwZXlvaW1kZGpjcmZjcm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTg0ODQsImV4cCI6MjA5NDg5NDQ4NH0.77uHn-8svG99moJIf0dXuHFeprcvcg70nnSqEaFOadQ" } }
        ).then(r => r.ok);
        checks.supabase = {
          ok: error !== undefined ? !error : true,
          latency_ms: Date.now() - start,
        };
      } catch (e: any) {
        checks.supabase = { ok: false, error: e.message };
        healthy = false;
      }

      setData({ status: healthy ? "ok" : "degraded", checks });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Verificando...
      </div>
    );
  }

  const isOk = data?.status === "ok";

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Activity size={28} className="text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Health Check</h1>
            <p className="text-sm text-muted-foreground">Status em tempo real do sistema</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isOk
            ? "bg-green-500/5 border-green-500/30"
            : "bg-red-500/5 border-red-500/30"
        }`}>
          <div className="flex items-center gap-2">
            {isOk ? (
              <CheckCircle2 size={20} className="text-green-500" />
            ) : (
              <XCircle size={20} className="text-red-500" />
            )}
            <span className={`font-semibold ${isOk ? "text-green-400" : "text-red-400"}`}>
              {isOk ? "Todos os sistemas operacionais" : "Problemas detectados"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database size={18} className="text-primary" />
              <div>
                <p className="text-sm font-medium">Supabase</p>
                <p className="text-xs text-muted-foreground">
                  {data?.checks?.supabase?.latency_ms
                    ? `${data.checks.supabase.latency_ms}ms`
                    : "—"}
                </p>
              </div>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              data?.checks?.supabase?.ok
                ? "bg-green-500/15 text-green-400"
                : "bg-red-500/15 text-red-400"
            }`}>
              {data?.checks?.supabase?.ok ? "OK" : "FAIL"}
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-primary" />
              <div>
                <p className="text-sm font-medium">Timestamp</p>
                <p className="text-xs text-muted-foreground font-mono">{data?.checks?.timestamp}</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-zinc-600 text-center">
          Endpoint público para monitoramento (UptimeRobot, BetterStack, etc)
        </p>
      </div>
    </div>
  );
}

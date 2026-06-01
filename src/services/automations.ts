import { supabase } from "@/lib/supabase";
import type { OwnerFlow, FlowStep, FlowTemplate } from "@/types";

function formatFlow(raw: any): OwnerFlow {
  const config = raw.config || {};
  const steps: FlowStep[] = config.steps || [];
  const triggered = raw.stats_triggered ?? 0;
  const responded = raw.stats_responded;
  const ordered = raw.stats_ordered;
  const revenue = raw.stats_revenue ? `R$${Number(raw.stats_revenue).toFixed(0).replace(".", ",")}` : undefined;

  return {
    id: raw.id,
    icon: raw.icon || "🤖",
    name: raw.name,
    description: raw.description || "",
    active: raw.active ?? false,
    stat: raw.active
      ? `🟢 Ativo · Disparado: ${triggered}x/mês`
      : "🔴 Inativo",
    detail: steps.length > 0 ? {
      steps,
      stats: { triggered, responded, ordered, revenue },
    } : undefined,
  };
}

export async function listFlows(restaurantId: string): Promise<OwnerFlow[]> {
  const { data, error } = await supabase
    .from("automation_flows")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(formatFlow);
}

export async function toggleFlow(flowId: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from("automation_flows")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", flowId);

  if (error) throw error;
}

export async function createFlow(
  restaurantId: string,
  data: {
    name: string;
    icon: string;
    description: string;
    steps: FlowStep[];
    active?: boolean;
  }
): Promise<OwnerFlow> {
  const { data: flow, error } = await supabase
    .from("automation_flows")
    .insert({
      restaurant_id: restaurantId,
      name: data.name,
      icon: data.icon,
      description: data.description,
      category: "custom",
      status: data.active ? "active" : "draft",
      active: data.active ?? true,
      config: { steps: data.steps },
    })
    .select()
    .single();

  if (error) throw error;
  return formatFlow(flow);
}

export async function updateFlowSteps(
  flowId: string,
  steps: FlowStep[]
): Promise<void> {
  const { error } = await supabase
    .from("automation_flows")
    .update({ config: { steps }, updated_at: new Date().toISOString() })
    .eq("id", flowId);

  if (error) throw error;
}

export async function copyFlowTemplate(template: FlowTemplate, restaurantId: string): Promise<OwnerFlow> {
  const flow = await createFlow(restaurantId, {
    name: template.name,
    icon: template.icon,
    description: template.description,
    steps: (template.config?.blocks as any[])?.map((b: any) => ({
      icon: b.icon ?? "🤖",
      label: b.title ?? b.block_type,
      message: b.message,
    })) ?? [],
    active: false,
  });
  return flow;
}

export async function duplicateFlow(flowId: string, restaurantId: string): Promise<OwnerFlow> {
  const { data: original } = await supabase.from("automation_flows").select("*").eq("id", flowId).single();
  if (!original) throw new Error("Flow not found");
  return createFlow(restaurantId, {
    name: original.name + " (cópia)",
    icon: original.icon ?? "🤖",
    description: original.description ?? "",
    steps: (original.config?.steps ?? []) as FlowStep[],
    active: false,
  });
}

export async function setFlowTriggerEvent(flowId: string, triggerEvent: string | null): Promise<void> {
  const config: Record<string, unknown> = {};
  if (triggerEvent) config.trigger_event = triggerEvent;
  const { error } = await supabase.from("automation_flows").update({ config }).eq("id", flowId);
  if (error) throw error;
}

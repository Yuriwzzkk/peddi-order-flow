import { supabase } from "@/lib/supabase";

export async function getFlowTemplates(): Promise<import("@/types").FlowTemplate[]> {
  const { data, error } = await supabase.from("flow_templates").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getFlowBlocks(flowId: string): Promise<import("@/types").FlowBlock[]> {
  const { data, error } = await supabase.from("flow_blocks").select("*").eq("flow_id", flowId).order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function createFlowBlock(
  flowId: string,
  block: { block_type: string; title?: string; icon?: string; message?: string; config?: Record<string, unknown>; position_x?: number; position_y?: number }
): Promise<import("@/types").FlowBlock> {
  const { data, error } = await supabase.from("flow_blocks").insert({ flow_id: flowId, ...block }).select().single();
  if (error) throw error;
  return data;
}

export async function updateFlowBlock(
  blockId: string,
  updates: Partial<import("@/types").FlowBlock>
): Promise<void> {
  const { error } = await supabase.from("flow_blocks").update(updates).eq("id", blockId);
  if (error) throw error;
}

export async function deleteFlowBlock(blockId: string): Promise<void> {
  const { error } = await supabase.from("flow_blocks").delete().eq("id", blockId);
  if (error) throw error;
}

export async function saveFlowConnections(
  flowId: string,
  connections: { from_block_id: string; to_block_id: string; label?: string }[]
): Promise<void> {
  const { error: delErr } = await supabase.from("flow_connections").delete().eq("flow_id", flowId);
  if (delErr) throw delErr;
  if (connections.length === 0) return;
  const { error } = await supabase.from("flow_connections").insert(
    connections.map(c => ({ flow_id: flowId, ...c }))
  );
  if (error) throw error;
}

export async function getFlowConnections(flowId: string): Promise<import("@/types").FlowConnection[]> {
  const { data, error } = await supabase.from("flow_connections").select("*").eq("flow_id", flowId).order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function startFlow(flowId: string, conversationId: string, variables?: Record<string, unknown>): Promise<{ state_id: string }> {
  const { data, error } = await supabase.rpc("start_flow_for_conversation", {
    p_flow_id: flowId,
    p_conversation_id: conversationId,
    p_variables: variables ?? {},
  });
  if (error) throw error;
  return { state_id: data };
}

export async function processFlowInput(conversationId: string, userInput: string): Promise<{ processed: boolean; action?: string; next_block_id?: string; reason?: string }> {
  const { data, error } = await supabase.rpc("process_flow_input", {
    p_conversation_id: conversationId,
    p_user_input: userInput,
  });
  if (error) throw error;
  return data;
}

export async function getConversationFlowState(conversationId: string): Promise<import("@/types").ConversationFlowState | null> {
  const { data, error } = await supabase
    .from("conversation_flow_state")
    .select("*")
    .eq("conversation_id", conversationId)
    .in("status", ["active", "paused"])
    .order("started_at", { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

export async function setConversationMode(conversationId: string, mode: "bot" | "manual" | "flow"): Promise<void> {
  const { error } = await supabase.from("conversations").update({ mode }).eq("id", conversationId);
  if (error) throw error;
}

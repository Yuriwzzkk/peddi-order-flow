import { supabase } from "@/lib/supabase";
import type { Conversation, Message } from "@/types";

function formatConversation(raw: any): Conversation {
  return {
    id: raw.id,
    restaurant_id: raw.restaurant_id,
    customer_id: raw.customer_id,
    customer_name: raw.customers?.name ?? raw.customer_name ?? "Desconhecido",
    channel: raw.channel ?? "whatsapp",
    status: raw.status ?? "open",
    mode: raw.mode ?? "bot",
    unread_count: raw.unread_count ?? 0,
    last_message_at: raw.last_message_at,
    messages: raw.messages ?? [],
  };
}

function formatMessage(raw: any): Message {
  return {
    id: raw.id,
    conversation_id: raw.conversation_id,
    sender: raw.sender,
    text: raw.text,
    message_type: raw.message_type ?? "text",
    created_at: raw.created_at,
  };
}

export async function listConversations(restaurantId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, customers(name)")
    .eq("restaurant_id", restaurantId)
    .order("last_message_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(formatConversation);
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, customers(name), messages(*)")
    .eq("id", id)
    .order("created_at", { referencedTable: "messages", ascending: true })
    .single();

  if (error) throw error;
  return data ? formatConversation(data) : null;
}

export async function sendMessage(
  conversationId: string,
  sender: "client" | "bot" | "attendant",
  text: string
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender,
      text,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return formatMessage(data);
}

export async function toggleConversationMode(
  conversationId: string,
  mode: "bot" | "attendant"
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ mode })
    .eq("id", conversationId);

  if (error) throw error;
}

export function subscribeConversations(
  restaurantId: string,
  callback: (conversation: Conversation, event: "INSERT" | "UPDATE") => void
) {
  return supabase
    .channel("conversations-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversations",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      async (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const conv = await getConversation(payload.new.id);
          if (conv) callback(conv, payload.eventType);
        }
      }
    )
    .subscribe();
}

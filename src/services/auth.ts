import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  restaurant_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "owner" | "delivery" | "presencial" | "master";
  type: "delivery" | "presencial" | null;
  shift: string | null;
  online: boolean;
  permissions: Record<string, unknown>;
  created_at: string;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export function onAuthChange(
  callback: (event: string, session: unknown) => void
) {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}

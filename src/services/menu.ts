import { supabase } from "@/lib/supabase";
import type { MenuItem, MenuCategory } from "@/types";

export async function listCategories(restaurantId: string): Promise<MenuCategory[]> {
  const { data, error } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("active", true)
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function createCategory(restaurantId: string, name: string, emoji?: string): Promise<MenuCategory> {
  const { data, error } = await supabase
    .from("menu_categories")
    .insert({ restaurant_id: restaurantId, name, emoji: emoji || "🍽️" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listMenuItems(restaurantId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*, menu_categories(name)")
    .eq("restaurant_id", restaurantId)
    .order("sort_order");

  if (error) throw error;
  return (data ?? []).map((item: any) => ({
    ...item,
    category_name: item.menu_categories?.name ?? null,
  }));
}

export async function createMenuItem(
  restaurantId: string,
  data: {
    name: string;
    description?: string;
    price: number;
    category_id?: string;
    available?: boolean;
    featured?: boolean;
    upsell?: boolean;
    upsell_product_id?: string;
    upsell_message?: string;
    image_url?: string;
  }
): Promise<MenuItem> {
  const { data: item, error } = await supabase
    .from("menu_items")
    .insert({
      restaurant_id: restaurantId,
      name: data.name,
      description: data.description ?? "",
      price: data.price,
      category_id: data.category_id ?? null,
      available: data.available ?? true,
      featured: data.featured ?? false,
      upsell: data.upsell ?? false,
      upsell_product_id: data.upsell_product_id ?? null,
      upsell_message: data.upsell_message ?? "",
      image_url: data.image_url ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return item;
}

export async function updateMenuItem(
  itemId: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    category_id: string;
    available: boolean;
    featured: boolean;
    upsell: boolean;
    upsell_product_id: string;
    upsell_message: string;
    image_url: string;
  }>
): Promise<void> {
  const { error } = await supabase.from("menu_items").update(data).eq("id", itemId);

  if (error) throw error;
}

export async function deleteMenuItem(itemId: string): Promise<void> {
  const { error } = await supabase.from("menu_items").delete().eq("id", itemId);

  if (error) throw error;
}

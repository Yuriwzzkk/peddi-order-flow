import { supabase } from "@/lib/supabase";

export async function uploadMenuImage(
  restaurantId: string,
  file: File,
  itemId?: string
): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${itemId || crypto.randomUUID()}.${ext}`;
  const filePath = `${restaurantId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("menu-images")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("menu-images")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function uploadLogo(
  restaurantId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const filePath = `${restaurantId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("restaurant-logos")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("restaurant-logos")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function deleteMenuImage(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from("menu-images")
    .remove([filePath]);
  if (error) throw error;
}

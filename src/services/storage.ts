// Serviço de upload de arquivos para Supabase Storage
import { supabase } from "@/lib/supabase";

const BUCKET = "restaurant-assets";

export type UploadResult = {
  url: string;
  path: string;
  size: number;
};

/**
 * Faz upload de uma logo para o bucket restaurant-assets.
 * Path: {restaurant_id}/logo-{timestamp}.{ext}
 */
export async function uploadRestaurantLogo(
  restaurantId: string,
  file: File
): Promise<UploadResult> {
  // Validar tipo
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Tipo de arquivo não permitido. Use PNG, JPG, WEBP ou SVG.");
  }

  // Validar tamanho (5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Arquivo muito grande. Máximo 5MB.");
  }

  const ext = file.name.split(".").pop() || "png";
  const fileName = `logo-${Date.now()}.${ext}`;
  const path = `${restaurantId}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return {
    url: urlData.publicUrl,
    path,
    size: file.size,
  };
}

/**
 * Remove uma logo do storage.
 */
export async function deleteRestaurantLogo(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);
  if (error) throw error;
}

/**
 * Atualiza uma logo (remove antiga + upload nova).
 */
export async function updateRestaurantLogo(
  restaurantId: string,
  newFile: File,
  oldPath?: string
): Promise<UploadResult> {
  if (oldPath) {
    try {
      await deleteRestaurantLogo(oldPath);
    } catch (e) {
      // Não bloquear se old não existir
      console.warn("Falha ao deletar logo antiga:", e);
    }
  }
  return uploadRestaurantLogo(restaurantId, newFile);
}

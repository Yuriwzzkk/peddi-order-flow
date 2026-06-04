import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadRestaurantLogo, updateRestaurantLogo, deleteRestaurantLogo } from "@/services/storage";

interface LogoUploaderProps {
  restaurantId: string;
  currentUrl?: string;
  currentPath?: string;
  onUploaded: (result: { url: string; path: string }) => void;
  onRemoved?: () => void;
}

export default function LogoUploader({
  restaurantId,
  currentUrl,
  currentPath,
  onUploaded,
  onRemoved,
}: LogoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Selecione um arquivo de imagem");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande (máx 5MB)");
        return;
      }
      setUploading(true);
      try {
        // Preview local imediato
        const localUrl = URL.createObjectURL(file);
        setPreview(localUrl);

        const result = currentPath
          ? await updateRestaurantLogo(restaurantId, file, currentPath)
          : await uploadRestaurantLogo(restaurantId, file);

        setPreview(result.url);
        onUploaded({ url: result.url, path: result.path });
        toast.success("Logo enviada com sucesso!");
        URL.revokeObjectURL(localUrl);
      } catch (e: any) {
        toast.error(e?.message || "Erro ao enviar logo");
        setPreview(currentUrl || null);
      } finally {
        setUploading(false);
      }
    },
    [restaurantId, currentPath, currentUrl, onUploaded]
  );

  const handleRemove = async () => {
    if (!currentPath) {
      setPreview(null);
      onRemoved?.();
      return;
    }
    setUploading(true);
    try {
      await deleteRestaurantLogo(currentPath);
      setPreview(null);
      onRemoved?.();
      toast.success("Logo removida");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao remover");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-lg border-2 border-dashed
          transition-all p-4 flex flex-col items-center justify-center gap-2
          min-h-[120px]
          ${dragging
            ? "border-primary bg-primary/5"
            : "border-admin-card-border bg-[hsl(0,0%,7%)] hover:border-primary/50"
          }
          ${preview ? "" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {uploading ? (
          <Loader2 size={24} className="text-primary animate-spin" />
        ) : preview ? (
          <div className="flex flex-col items-center gap-2 w-full">
            <img
              src={preview}
              alt="Logo"
              className="h-16 max-w-full object-contain rounded"
              onError={() => setPreview(null)}
            />
            <p className="text-[10px] text-muted-foreground">Clique para trocar</p>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload size={18} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium">Arraste ou clique para enviar</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                PNG, JPG, WEBP ou SVG · Máx 5MB
              </p>
            </div>
          </>
        )}
      </div>

      {preview && !uploading && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="w-full text-xs text-destructive hover:text-destructive"
        >
          <X size={12} className="mr-1" /> Remover logo
        </Button>
      )}
    </div>
  );
}

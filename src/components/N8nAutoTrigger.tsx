import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useN8nEvents } from "@/hooks/useN8nEvents";

export default function N8nAutoTrigger() {
  const { profile } = useAuth();
  const restaurantId = profile?.restaurant_id;

  const { processQueue } = useN8nEvents(restaurantId);

  useEffect(() => {
    if (!restaurantId) return;
    processQueue();
  }, [restaurantId, processQueue]);

  return null;
}

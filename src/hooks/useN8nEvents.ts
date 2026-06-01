import { useEffect, useRef, useCallback } from "react";
import { dispatchPendingAutomationQueue, dispatchToWebhooks } from "@/services/n8n-dispatch";

type N8nEvent = "order_created" | "order_status_changed" | "new_conversation" | "new_customer" | "payment_received";

export function useN8nEvents(restaurantId: string | null | undefined) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerEvent = useCallback(
    async (event: N8nEvent, payload?: Record<string, unknown>) => {
      if (!restaurantId) return;
      try {
        await dispatchToWebhooks(restaurantId, event, payload);
      } catch {
        // silent — n8n dispatch should never break the user flow
      }
    },
    [restaurantId]
  );

  const processQueue = useCallback(async () => {
    if (!restaurantId) return;
    try {
      await dispatchPendingAutomationQueue(restaurantId);
    } catch {
      // silent
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;

    processQueue();

    intervalRef.current = setInterval(() => {
      processQueue();
    }, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [restaurantId, processQueue]);

  return { triggerEvent, processQueue };
}

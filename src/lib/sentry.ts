// src/lib/sentry.ts
// Inicialização do Sentry para error tracking
import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PROD = import.meta.env.PROD;

export function initSentry() {
  if (!SENTRY_DSN) {
    if (IS_PROD) {
      console.warn("Sentry DSN não configurado (VITE_SENTRY_DSN). Errors não serão reportados.");
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    // Apenas capturar 100% em prod, 10% em dev para não spammar
    tracesSampleRate: IS_PROD ? 0.1 : 1.0,
    // Capturar sessão de usuário (sem dados sensíveis)
    autoSessionTracking: true,
    // Ignorar erros conhecidos de browser extensions, adblockers
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Failed to load resource: net::ERR_BLOCKED_BY_CLIENT",
      "Network request failed",
    ],
    beforeSend(event) {
      // Sanitizar dados sensíveis antes de enviar
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      return event;
    },
  });
}

/**
 * Captura erro manualmente.
 * Use para erros que não são exceptions (ex: fetch failed mas tratado).
 */
export function captureError(err: any, context?: Record<string, any>) {
  if (SENTRY_DSN) {
    Sentry.captureException(err, { extra: context });
  } else {
    console.error("Error capturado:", err, context);
  }
}

/**
 * Adiciona breadcrumb (rastro) para debug.
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  if (SENTRY_DSN) {
    Sentry.addBreadcrumb({ message, data, level: "info" });
  }
}

/**
 * Componente para Error Boundary (pegar erros de UI).
 */
export const SentryErrorBoundary = SENTRY_DSN ? Sentry.ErrorBoundary : null;

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry, SentryErrorBoundary } from "./lib/sentry";

// Inicializar Sentry o mais cedo possível
initSentry();

const rootEl = document.getElementById("root")!;
const tree = <App />;

// Wrap com ErrorBoundary se Sentry estiver configurado
if (SentryErrorBoundary) {
  createRoot(rootEl).render(
    <SentryErrorBoundary fallback={<ErrorFallback />}>
      {tree}
    </SentryErrorBoundary>
  );
} else {
  createRoot(rootEl).render(tree);
}

function ErrorFallback() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: "system-ui, sans-serif",
      background: "#0a0a0a",
      color: "#fff",
    }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Algo deu errado 😔</h1>
      <p style={{ color: "#888", marginBottom: 24, textAlign: "center" }}>
        Nossa equipe foi notificada. Por favor, recarregue a página.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: "#FF6B2C",
          color: "#fff",
          border: "none",
          padding: "12px 24px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Recarregar
      </button>
    </div>
  );
}

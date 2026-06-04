# 📊 Sentry — Error Tracking

## O que é

Sentry é uma plataforma que captura erros de frontend (JavaScript, React) e backend (Edge Functions, logs) automaticamente. Você recebe alertas por email/Slack e pode ver stack traces, contexto de usuário (anonimizado), e métricas de impacto.

**Free tier**: 5.000 eventos/mês, 1 projeto, 7 dias de retenção.

## Como configurar

### 1. Criar conta

1. Acesse https://sentry.io/signup/
2. Crie conta (pode usar GitHub)
3. Confirme email

### 2. Criar projeto React/Vite

1. No dashboard Sentry, clique **"+ Create Project"**
2. Plataforma: **React**
3. Nome: `peddi-web`
4. Copie o **DSN** (formato: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### 3. Adicionar DSN no Vercel

No projeto Vercel → **Settings** → **Environment Variables**:
```
VITE_SENTRY_DSN = https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

Faça **redeploy** após adicionar.

### 4. Verificar funcionamento

Acesse `https://foodwaker.app` (ou sua URL Vercel) e force um erro:

```js
// Cole no console do browser
throw new Error("Teste Sentry");
```

Aguarde 30-60s. Vá em https://sentry.io/issues/ e veja o evento aparecer.

### 5. (Opcional) Source Maps

Para que Sentry mostre o código original (não o minificado), configure upload automático:

1. Instale `@sentry/vite-plugin`:
   ```bash
   npm install @sentry/vite-plugin --save-dev
   ```

2. Crie auth token em https://sentry.io/settings/auth-tokens/

3. Adicione secrets no GitHub (para CI/CD):
   - `SENTRY_AUTH_TOKEN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`

4. Atualize `vite.config.ts`:
   ```ts
   import { sentryVitePlugin } from "@sentry/vite-plugin";

   export default defineConfig({
     plugins: [
       react(),
       sentryVitePlugin({
         org: process.env.SENTRY_ORG,
         project: process.env.SENTRY_PROJECT,
         authToken: process.env.SENTRY_AUTH_TOKEN,
       }),
     ],
   });
   ```

### 6. Alertas

Configure em **Settings** → **Alerts**:
- Email quando surge novo erro
- Slack (integração)
- Limite de eventos por hora (evita spam)

---

## Integração com Supabase Edge Functions

As edge functions já logam com `console.error`. Para enviar para Sentry:

1. Crie projeto Sentry tipo "Node" → `peddi-functions`
2. Adicione `@sentry/deno` nas edge functions
3. Configure Sentry.init() no início de cada function

**Ou mais simples**: Supabase tem integração nativa em **Settings** → **Integrations** → **Sentry**. Ative e conecte.

---

## Custos

| Plano | Custo | Eventos/mês |
|-------|-------|-------------|
| Free | $0 | 5K |
| Team | $26/mês | 50K |
| Business | $80/mês | 200K |

Para um SaaS novo, Free é suficiente. Quando passar de 5K eventos/mês, migre para Team.

---

## O que Sentry NÃO faz

- **Não captura erros de servidor de hospedagem** (Vercel tem seu próprio log)
- **Não substitui logs estruturados** (use Sentry para exceptions, console.log para debug)
- **Não é analytics** (use GA4/Plausible para isso)

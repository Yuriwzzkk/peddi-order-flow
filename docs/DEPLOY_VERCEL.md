# 🚀 TAREFA 8: Deploy no Vercel

## ⚠️ AÇÃO NECESSÁRIA

Não posso fazer deploy sozinho (precisa de conta Vercel + GitHub). Documentação completa abaixo.

---

## Passo 1: Subir código para GitHub (se ainda não estiver)

```bash
git init
git add .
git commit -m "feat: production ready"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/peddi-order-flow.git
git push -u origin main
```

---

## Passo 2: Criar conta Vercel

1. Acesse https://vercel.com/signup
2. Conecte com GitHub
3. Autorize Vercel a acessar seus repos

---

## Passo 3: Importar Projeto

1. No Vercel Dashboard, clique **"+ New Project"**
2. Selecione o repo `peddi-order-flow`
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (auto-detectado)
   - **Output Directory**: `dist` (auto-detectado)
   - **Install Command**: `npm install`

4. **Environment Variables** (adicione):
   ```
   VITE_SUPABASE_URL = https://sqclpeyoimddjcrfcrmi.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGc... (sua anon key)
   ```

5. Clique **"Deploy"**

---

## Passo 4: Aguardar primeiro deploy

- 1-3 minutos para o build completar
- Vercel vai dar uma URL: `peddi-order-flow.vercel.app`

---

## Passo 5: Configurar domínio customizado

### 5a. Adicionar foodwaker.app

1. No projeto Vercel, vá em **Settings** → **Domains**
2. Digite `foodwaker.app` → **Add**
3. Vercel vai mostrar registros DNS que você precisa configurar no Cloudflare:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

4. Vá no **Cloudflare** → DNS → Records e atualize:
   - A `@` → 76.76.21.21 (Proxy ON - laranja)
   - CNAME `www` → cname.vercel-dns.com (Proxy ON - laranja)
   - CNAME `*` → cname.vercel-dns.com (DNS only - cinza, para wildcard)

5. Volte no Vercel e clique **"Refresh"** → deve reconhecer o domínio

### 5b. Adicionar wildcard *.foodwaker.app

1. Ainda em **Settings** → **Domains**
2. Digite `*.foodwaker.app` → **Add**
3. Vercel pode pedir verificação adicional via TXT record
4. Adicione o TXT no Cloudflare conforme instruído

---

## Passo 6: Configurar CI/CD (GitHub Actions)

Os secrets que precisa adicionar no GitHub:

1. Vá em https://github.com/SEU_USUARIO/peddi-order-flow/settings/secrets/actions
2. Adicione:
   - `VITE_SUPABASE_URL` = `https://sqclpeyoimddjcrfcrmi.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJ...`
3. O workflow `.github/workflows/test.yml` já está configurado e vai rodar automaticamente em PRs

---

## Passo 7: Testar em produção

Após o deploy:
- Acesse `https://peddi-order-flow.vercel.app` (URL temporária)
- Acesse `https://foodwaker.app` (deve carregar a landing)
- Acesse `https://burger-house.foodwaker.app` (deve carregar a landing, e se TenantResolver funcionar, mostrar "Domínio não configurado" para slug que não tem restaurante com `use_custom_domain=true`)

### Teste multi-tenant
1. Acesse `https://foodwaker.app` → landing normal
2. Acesse `https://burger-house.foodwaker.app` → landing (porque o Burger House não tem `use_custom_domain=true` configurado pelo master via whitelabel)
3. Master configura Burger House com `use_custom_domain=true` + `domain_verified=true` + `custom_domain=burger-house.foodwaker.app`
4. Acesse `https://burger-house.foodwaker.app` → agora vê painel do Burger House

---

## Custos

| Plano | Custo | Recursos |
|-------|-------|----------|
| Hobby (Free) | $0/mês | 100GB bandwidth, 100 deployments/dia, SSL grátis |
| Pro | $20/mês | Para商用 comercial |

**Para SaaS vendável**: comece com Hobby, quando passar de 100GB/mês migre para Pro.

---

## Monitorar deploy

- Vercel Dashboard: https://vercel.com/dashboard
- Build logs: clique no deploy
- Real-time analytics
- Custom domain status

---

## Próximo passo após deploy

Me avise quando deploy estiver live. Vou:
1. Testar URLs de produção
2. Verificar tenant resolver em subdomínios reais
3. Prosseguir para TAREFA 9 (Sentry)

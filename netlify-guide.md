# Deploy Netlify — Guia Rápido

## 1. Criar conta e site

1. Acesse https://app.netlify.com
2. Faça login com GitHub
3. Clique **"Add new site"** → **"Import an existing project"**

## 2. Conectar com GitHub

1. Escolha **"Deploy with GitHub"**
2. Autorize o Netlify a acessar seus repositórios
3. Selecione o repositório `peddi-order-flow`
4. Clique **"Deploy site"**

## 3. Configurar o site

Após o deploy inicial, vá em **Site settings** → **Environment variables**:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://sqclpeyoimddjcrfcrmi.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

> ⚠️ As variáveis já estão hardcoded no `netlify.toml`, mas é melhor prática colocar nos Environment Variables do dashboard para segurança.

## 4. Branches (ambientes)

| Branch | URL |
|--------|-----|
| `main` | `https://peddi.netlify.app` (produção) |
| `develop` | `https://develop--peddi.netlify.app` (pré-produção) |

Ative em **Site settings** → **Branches and deploy contexts** → habilite `develop`.

## 5. Domínio customizado (opcional)

1. **Site settings** → **Domain management**
2. Clique **"Add custom domain"**
3. Digite `app.peddi.com.br` (ou seu domínio)
4. Configure o DNS: aponte o CNAME para `peddi.netlify.app`

## 6. Deploy automático

A partir de agora, **todo `git push` na `main` faz deploy automático**:

```bash
git add -A
git commit -m "feat: descrição"
git push
# ✅ 30 segundos depois o site já está atualizado
```

## 7. Logs e troubleshooting

- **Deploy log:** https://app.netlify.com/sites/peddi-order-flow/deploys
- **Build log:** clique no deploy para ver detalhes
- **Function logs** (se aplicável): **Functions** → clicar na função

## Comandos úteis

```bash
# Build local (testar antes de subir)
npm run build

# Preview local
npx netlify dev

# Deploy manual (precisa do CLI)
npx netlify deploy --prod --dir=dist
```

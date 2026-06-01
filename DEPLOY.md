# Deploy do Frontend Peddi

## Pré-requisitos

- Node.js >= 18
- NPM

## 1. Clone e Instale

```bash
git clone <seu-repo>
cd peddi-order-flow-main
npm install
```

> ⚠️ Se `npm install` travar, tente: `npm install --prefer-offline --no-audit --no-fund`

## 2. Configure as variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

As variáveis já apontam para o Supabase Peddi. **Não altere** a não ser que esteja usando outro projeto Supabase.

## 3. Build

```bash
npm run build
```

> Se falhar com erro `caniuse-lite`, rode:
> ```bash
> npx update-browserslist-db@latest
> npm run build
> ```

Se `vite` global conflitar com Python, use:

```bash
node node_modules/vite/bin/vite.js build
```

O build gera a pasta `dist/`.

## 4. Deploy

### Vercel (recomendado)

1. Vá em https://vercel.com/new
2. Importe o repositório
3. Framework: Vite
4. Build: `npm run build`
5. Output: `dist`
6. Adicione as env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Deploy

### Netlify

1. Vá em https://app.netlify.com/sites/new
2. Importe o repositório
3. Build: `npm run build`
4. Publish: `dist`
5. Adicione as env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy

### Host próprio (Nginx, Apache, etc.)

```bash
npm run build
# Envie o conteúdo de dist/ para o servidor
# Configure SPA fallback: todas as rotas -> index.html
```

**Nginx config (exemplo):**
```nginx
server {
  listen 80;
  server_name app.peddi.com.br;
  root /var/www/peddi/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## 5. Teste

Após o deploy, acesse:

- **Login:** `/login` — entre com email/senha
- **Onboarding:** `/onboarding` — crie novo restaurante
- **Admin:** `/admin/dashboard` — painel do restaurante
- **Delivery:** `/delivery/orders` — painel do entregador
- **Presencial:** `/presencial/new-order` — pedido presencial

### Usuários de teste

| Email | Senha | Role |
|-------|-------|------|
| `admin@peddi.com.br` | `123456` | owner |
| `pedro@peddi.com.br` | `123456` | delivery |
| `carlos@peddi.com.br` | `123456` | presencial |
| `master@peddi.com.br` | `123456` | master |

## 6. Troubleshooting

**Erro: esbuild binary version mismatch**
```bash
npm rebuild esbuild
```

**Erro: caniuse-lite outdated**
```bash
npx update-browserslist-db@latest
```

**Erro: vite command not found**
```bash
node node_modules/vite/bin/vite.js build
```

**Erro no Supabase (RLS bloqueando)**
O frontend usa a anon key, que respeita as RLS policies. Se um RPC retornar erro, verifique se:
1. O usuário está logado
2. O usuário tem permissão (role correta)
3. O RPC existe: `supabase rpc <nome>`

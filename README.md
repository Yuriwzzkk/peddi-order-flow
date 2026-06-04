# 🚀 Peddi — SaaS Multi-Tenant

Plataforma white-label para restaurantes com WhatsApp, Z-API, N8n, IA e SyncPay.

## 🎯 Status: Pronto para vender

### ✅ Funcionalidades

- **Multi-tenant**: cada cliente tem seu próprio espaço (subdomínio ou domínio próprio)
- **3 painéis por restaurante**: admin / delivery / presencial
- **White-label completo**: logo, cores, nome, slug
- **Pagamento SyncPay**: PIX via checkout próprio
- **Webhook → Auto-provision**: pagamento confirmado cria restaurante + admin
- **Master Guard**: rota /master escondida de não-masters
- **Z-API WhatsApp**: cada cliente configura sua instância
- **N8n**: webhooks customizados + prompts IA
- **RLS reforçado**: segurança em todas as tabelas críticas
- **Audit log**: registra logins e ações sensíveis

---

## 🔐 Credenciais de teste

| Role | Email | Senha | UUID |
|------|-------|-------|------|
| Master | master@peddi.com.br | 123456 | 2b53c090-c3b1-4e97-978d-d1ba87e78d87 |
| Admin Burger House | admin@burgerhouse.com | 123456 | - |
| Delivery | entrega@burgerhouse.com | 123456 | - |
| Presencial | presencial@burgerhouse.com | 123456 | - |
| Pizzaria Teste E2E | admin@pizzaria.com | 123456 | - |

---

## 💰 Planos

| Plano | Preço/mês | Recursos |
|-------|-----------|----------|
| Starter | R$ 97 | 1 atendente, WhatsApp, até 500 pedidos/mês |
| Pro | R$ 197 | 3 atendentes, WhatsApp + IA, pedidos ilimitados |

Configurável em `saas_settings`.

---

## 🏗️ Arquitetura

```
Landing (/) → Checkout (/checkout?plan=X) → SyncPay PIX → Webhook
                                                          ↓
                                            Auto-cria restaurant + admin
                                                          ↓
                                            Email ao master (Resend)
                                                          ↓
Cliente acessa slug.foodwaker.app (subdomínio) OU dominio-custom.com.br
                                                          ↓
                                            Whitelabel ativo
                                                          ↓
                                  Painel: /admin | /delivery | /presencial
```

---

## 📁 Estrutura

```
src/
├── pages/
│   ├── Index.tsx               # Landing
│   ├── Checkout.tsx            # Pagamento SyncPay (R$ 97/197)
│   ├── PainelAcesso.tsx        # Login unificado
│   ├── admin/                  # Painel admin
│   ├── delivery/               # Painel delivery
│   ├── presencial/             # Painel presencial
│   └── master/                 # Master (com MasterGuard)
├── components/
│   ├── landing/                # Landing
│   ├── admin/                  # Componentes admin
│   ├── master/                 # MasterGuard
│   └── ui/                     # Shadcn
├── services/
│   ├── payments.ts             # createPixPayment, checkPaymentStatus
│   ├── n8n.ts                  # N8n CRUD
│   ├── whatsapp.ts             # sendWhatsAppMessage
│   └── orders.ts               # Orders
├── App.tsx                     # Rotas + MasterGuard
└── main.tsx

supabase/
├── migrations/                 # 11 migrations
│   └── 011_security_rls.sql    # RLS reforçado
└── functions/                  # 7 edge functions
    ├── syncpay-create-payment/ # Gera PIX
    ├── syncpay-check-status/   # Consulta status
    ├── syncpay-webhook/        # Recebe webhook
    ├── configure-panel/        # Configura painel
    ├── create-user/            # Cria user equipe
    ├── send-whatsapp/          # WhatsApp via Z-API
    └── n8n-webhook/            # Webhook N8n
```

---

## 🌐 Multi-tenant

Cada cliente tem seu próprio restaurante no DB. A coluna `restaurants.restaurant_id` filtra tudo.

### Subdomínio
- `slug.foodwaker.app` (slug do restaurante)
- SSL wildcard via Cloudflare
- Zero configuração pelo cliente

### Domínio próprio
- Cliente aponta CNAME para `foodwaker.app`
- Frontend chama `get_tenant_by_domain(window.location.hostname)` RPC
- Aplica white label em todo o app

📖 [Guia completo de domínio](docs/DOMINIO_CUSTOMIZADO.md)

---

## 🧪 Como testar

1. **Login master**: `master@peddi.com.br` / `123456`
2. **Ver Pizzaria Teste E2E** em `/master/whitelabel` (criada via pagamento)
3. **Login admin pizzaria**: `admin@pizzaria.com` / `123456` (criado via whitelabel)
4. **Teste novo pagamento** em `/checkout?plan=starter`
5. **Verificar webhook** simulando: `node simulate_webhook.mjs`

### Playwright tests

```bash
node test_checkout_whitelabel.cjs   # Pagamento + whitelabel
node test_e2e_payment.cjs           # Whitelabel + login novo admin
```

---

## 🔧 Configuração de produção

### 1. Secrets do Supabase

```bash
# SyncPay
supabase secrets set SYNCPAY_CLIENT_ID=9bd9d69c-d42f-4d7d-936d-5c51226f84a7
supabase secrets set SYNCPAY_CLIENT_SECRET=d86751e8-7c2f-4526-ba19-f831cdc61fe0

# Resend (emails)
supabase secrets set RESEND_API_KEY=re_xxxxxxx

# Webhook SyncPay URL
# Configurado em supabase/functions/syncpay-webhook/index.ts
```

### 2. DNS

- `foodwaker.app` → IP do servidor (Vercel/Hostinger)
- `*.foodwaker.app` → CNAME para `foodwaker.app` (wildcard)
- SSL via Cloudflare (Full Strict)

### 3. Variáveis de ambiente (Vercel/Netlify)

```
VITE_SUPABASE_URL=https://sqclpeyoimddjcrfcrmi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 📊 Banco de dados

### Tabelas principais

- `restaurants` — cada cliente
- `profiles` — usuários (owner, delivery, presencial, master)
- `menu_categories` / `menu_items` — cardápio
- `orders` / `payments` — pedidos
- `conversations` / `messages` — chat WhatsApp
- `automation_flows` / `flow_blocks` — fluxos IA
- `zapi_config` — config WhatsApp por restaurante
- `n8n_webhooks` — webhooks customizados
- `restaurant_settings` — config do restaurante
- `payment_intents` — pagamentos SyncPay
- `saas_settings` — config do SaaS (preços, etc)
- `audit_log` — log de ações sensíveis

### RPCs importantes

- `get_tenant_by_domain(p_domain)` — resolve tenant
- `update_payment_intent_status(p_id, p_status)` — auto-provision
- `create_peddi_user(...)` — cria user SEM NULL tokens
- `get_user_role()` / `get_user_restaurant_id()` — auth helpers

---

## 🛡️ Segurança

- **RLS ativo** em todas as tabelas
- **MasterGuard** esconde `/master/*` de não-masters
- **Auth bcrypt cost 10** + tokens `''` (não NULL)
- **Search path `public`** em todas as functions
- **Audit log** registra logins e ações críticas
- **Lockout** após 5 falhas em 15min

---

## 💼 Para vender

1. **Cliente acessa** `foodwaker.app`
2. **Clica "Começar agora"** → `/checkout?plan=starter` ou `pro`
3. **Paga via PIX** (R$ 97 ou R$ 197)
4. **Webhook** cria restaurante + admin automaticamente
5. **Master recebe email** com credenciais
6. **Master configura white label** em `/master/whitelabel`
7. **Master envia credenciais** ao cliente
8. **Cliente acessa** `slug.foodwaker.app` ou domínio próprio
9. **Configura WhatsApp (Z-API)** em Settings
10. **Cria fluxo IA** em Automation
11. **Pronto!**

---

## 📞 Suporte

- Issues: criar no GitHub
- Email: suporte@peddi.com.br
- WhatsApp: (configurar)

---

**Versão**: 1.0
**Data**: Jun 2026
**Stack**: React + Vite + Supabase + Edge Functions + SyncPay

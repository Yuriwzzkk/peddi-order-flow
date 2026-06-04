# 🔐 Como configurar Secrets do Supabase

## Passo a Passo (Dashboard)

1. Acesse: https://supabase.com/dashboard/project/sqclpeyoimddjcrfcrmi/settings/functions
2. Role até a seção **"Function Secrets"** ou **"Edge Function Secrets"**
3. Clique em **"Add new secret"** e adicione:

| Nome | Valor |
|------|-------|
| `SYNCPAY_CLIENT_ID` | `9bd9d69c-d42f-4d7d-936d-5c51226f84a7` |
| `SYNCPAY_CLIENT_SECRET` | `d86751e8-7c2f-4526-ba19-f831cdc61fe0` |
| `SYNCPAY_WEBHOOK_SECRET` | `peddi-webhook-secret-2026` |
| `RESEND_API_KEY` | *(você precisa criar conta em resend.com e gerar API key)* |

4. Clique em **"Save"** em cada uma

## Como gerar RESEND_API_KEY

1. Acesse https://resend.com/signup (free tier: 100 emails/dia, 3000/mês)
2. Confirme email
3. Vá em **API Keys** → **Create API Key**
4. Copie a chave (começa com `re_...`)
5. Cole no Supabase como `RESEND_API_KEY`
6. **Importante**: também precisa adicionar e verificar domínio `foodwaker.app` em Resend > Domains para enviar emails com esse remetente

## Verificação

Após adicionar, as edge functions vão automaticamente pegar os secrets. Não precisa reiniciar nada.

Para confirmar que está funcionando, me avise que prossigo e eu verifico via logs das edge functions.

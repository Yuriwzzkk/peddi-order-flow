# 📡 TAREFA 10: Uptime Monitoring

## ⚠️ AÇÃO NECESSÁRIA

Não posso criar conta UptimeRobot para você (precisa de email). Documentação abaixo.

---

## O que é

UptimeRobot pinga seu site a cada 5min e te avisa por email/Slack quando fica fora do ar por mais de 2min. Free tier: 50 monitores, 5min de intervalo.

**Alternativas**: BetterStack (R$ 0/mês para 1 monitor), Cronitor (similar), ou um simples curl no cron.

---

## Como configurar UptimeRobot

### 1. Criar conta

1. Acesse https://uptimerobot.com/signUp
2. Crie conta (pode usar Google)
3. Confirme email

### 2. Adicionar monitor do frontend

1. No dashboard, clique **"+ Add New Monitor"**
2. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `Peddi Landing`
   - **URL**: `https://foodwaker.app` (ou `https://peddi-order-flow.vercel.app` durante dev)
   - **Monitoring Interval**: 5 minutes
3. Clique **"Create Monitor"**

### 3. Adicionar monitor do Supabase

1. **+ Add New Monitor** novamente
2. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `Peddi API (Supabase)`
   - **URL**: `https://sqclpeyoimddjcrfcrmi.supabase.co/rest/v1/`
   - **Monitoring Interval**: 5 minutes
3. Salvar

### 4. Adicionar monitor da edge function SyncPay

1. **+ Add New Monitor**
2. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `Peddi Edge Functions`
   - **URL**: `https://sqclpeyoimddjcrfcrmi.supabase.co/functions/v1/syncpay-webhook` (testa 400, que é OK)
   - **Monitoring Interval**: 5 minutes
3. Salvar

### 5. Configurar alertas

1. Vá em **My Settings** → **Alert Contacts**
2. Adicione:
   - Email principal
   - Email secundário
   - (Opcional) Slack webhook URL
   - (Opcional) Telegram bot

3. Em cada monitor, configure:
   - **Alert Contacts**: selecione os emails
   - **Alert When Down For**: 2 minutes (não alerta para quedas < 2min)

### 6. Status page público (opcional)

UptimeRobot oferece página pública de status:
1. Vá em **Status Pages** → **+ Add Status Page**
2. Configure com os monitores
3. URL pública: `stats.uptimerobot.com/xxxxx` (pode custom domain)

Compartilhe com clientes para mostrar SLA.

---

## Custos

| Plano | Custo | Monitores | Intervalo |
|-------|-------|-----------|-----------|
| Free | $0 | 50 | 5min |
| Pro | $7/mês | 50 | 1min |
| Business | $29/mês | 200 | 1min |

Para SaaS pequeno, Free é suficiente. Considere Pro para monitorar a cada 1min.

---

## Endpoint interno /health

Já criei em `src/pages/Health.tsx` que:
- Faz ping ao Supabase
- Retorna latência
- Mostra status visual

Use em: `https://foodwaker.app/health` (só após deploy)

---

## Alternativa: cron job simples

Se preferir não usar UptimeRobot, configure um cron job:

```bash
# Adicione em crontab: pingar a cada 5min
*/5 * * * * curl -fsS https://foodwaker.app/health || echo "Site down!" | mail -s "Peddi DOWN" seu@email.com
```

---

## Próximo passo

Me avise quando configurar UptimeRobot. Vou validar que os endpoints estão respondendo e prosseguir para TAREFA 11 (Backups).

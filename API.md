# Peddi API — Documentação Completa

Todas as APIs são acessadas via `import { api } from "@/services/api"` ou importando funções individuais de cada serviço.

---

## Setup

```bash
VITE_SUPABASE_URL=https://sqclpeyoimddjcrfcrmi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```tsx
import { supabase } from "@/lib/supabase";
// ou
import api from "@/services/api";
```

---

## `api.auth`

| Método | Descrição |
|--------|-----------|
| `supabase` | Instância do Supabase Client |
| `signIn(email, password)` | Login email+senha |
| `signOut()` | Logout |
| `getProfile(userId)` | Busca perfil do usuário |

---

## `api.orders`

| Método | Descrição |
|--------|-----------|
| `list(restaurantId)` | Lista pedidos do restaurante |
| `get(orderId)` | Detalhe do pedido |
| `createWithItems(restaurantId, customerId, data)` | Cria pedido com itens (1 transação) |
| `updateStatus(orderId, status, restaurantId?)` | Atualiza status (valida transições) |
| `assignDelivery(orderId, personId, restaurantId?)` | Atribui entregador + tracking |
| `completeDelivery(orderId, restaurantId?)` | Finaliza entrega |
| `subscribe(restaurantId, callback)` | Tempo real: `(order, "INSERT"|"UPDATE"|"DELETE") => void` |
| `getMenuWithCategories(restaurantId)` | Cardápio agrupado por categoria |
| `getConversationsWithLastMessage(restaurantId)` | Conversas com última mensagem |

### `createWithItems — data`

```ts
{
  type?: string;          // "delivery" | "presencial"
  channel?: string;       // "whatsapp" | "presencial"
  items: { menu_item_id: string; quantity: number; notes?: string }[];
  notes?: string;
  delivery_address?: string;
  payment_method?: string;
  change_for?: number;
  observation?: string;
}
```

---

## `api.menu`

| Método | Descrição |
|--------|-----------|
| `listCategories(restaurantId)` | Lista categorias do cardápio |
| `createCategory(restaurantId, name, emoji?)` | Cria categoria |
| `listItems(restaurantId)` | Lista itens do cardápio |
| `createItem(restaurantId, data)` | Cria item |
| `updateItem(itemId, data)` | Atualiza item |
| `deleteItem(itemId)` | Remove item |
| `uploadImage(restaurantId, file, itemId?)` | Upload imagem do item (storage) |

### `createItem — data`

```ts
{
  name: string;
  description?: string;
  price: number;
  category_id?: string;
  available?: boolean;
  featured?: boolean;
  upsell?: boolean;
  upsell_product_id?: string;
  upsell_message?: string;
  image_url?: string;
}
```

---

## `api.customers`

| Método | Descrição |
|--------|-----------|
| `list(restaurantId)` | Lista clientes |
| `get(customerId)` | Detalhe do cliente |

---

## `api.conversations`

| Método | Descrição |
|--------|-----------|
| `list(restaurantId)` | Lista conversas |
| `get(conversationId)` | Detalhe da conversa |
| `sendMessage(convId, sender, text)` | Envia mensagem (`"client"\|"bot"\|"attendant"`) |
| `toggleMode(convId, mode)` | Alterna modo (`"bot"\|"attendant"`) |

---

## `api.team`

| Método | Descrição |
|--------|-----------|
| `list(restaurantId)` | Lista atendentes/entregadores |
| `create(data)` | Cria membro da equipe |
| `update(profileId, data)` | Atualiza membro |
| `delete(profileId)` | Remove membro |

---

## `api.dashboard`

| Método | Descrição |
|--------|-----------|
| `stats(restaurantId)` | Dashboard: pedidos hoje, receita, métodos, horários, atendentes |

---

## `api.analytics`

| Método | Descrição |
|--------|-----------|
| `orderReport(restaurantId, period?)` | Relatório de pedidos (`"day"\|"week"\|"month"`) |
| `customerAnalytics(restaurantId)` | Analytics de clientes |
| `menuPerformance(restaurantId)` | Performance do cardápio (mais vendidos) |
| `deliveryPerformance(restaurantId)` | Performance de entregas |
| `financialReport(restaurantId, days?)` | Relatório financeiro (default 30 dias) |

---

## `api.reports`

| Método | Descrição |
|--------|-----------|
| `orderSummary(restaurantId)` | Sumário de pedidos |
| `dailyRevenue(restaurantId)` | Receita diária |
| `topItems(restaurantId)` | Itens mais vendidos |
| `attendantPerformance(restaurantId)` | Performance por atendente |

---

## `api.automations`

| Método | Descrição |
|--------|-----------|
| `listFlows(restaurantId)` | Lista fluxos de automação |
| `toggleFlow(flowId, active)` | Ativa/desativa fluxo |
| `createFlow(restaurantId, data)` | Cria fluxo personalizado |
| `duplicateFlow(flowId, restaurantId)` | Duplica fluxo existente |
| `copyTemplate(template, restaurantId)` | Copia template para restaurante |
| `setTriggerEvent(flowId, event)` | Define evento de gatilho |

---

## `api.flowEngine`

| Método | Descrição |
|--------|-----------|
| `startFlow(flowId, conversationId, variables?)` | Inicia fluxo em conversa |
| `processInput(conversationId, input)` | Processa input do cliente no fluxo atual |
| `getFlowState(conversationId)` | Estado atual do fluxo |
| `getTemplates()` | Lista templates de flow |
| `getBlocks(flowId)` | Blocos do fluxo |
| `createBlock(flowId, block)` | Cria bloco no fluxo |
| `updateBlock(blockId, updates)` | Atualiza bloco |
| `deleteBlock(blockId)` | Remove bloco |
| `saveConnections(flowId, connections)` | Salva conexões entre blocos |
| `setConversationMode(convId, mode)` | Muda modo (`"bot"\|"manual"\|"flow"`) |

### `createBlock — block`

```ts
{
  block_type: string;
  title?: string;
  icon?: string;
  message?: string;
  config?: Record<string, unknown>;
  position_x?: number;
  position_y?: number;
}
```

### `saveConnections — connections`

```ts
{ from_block_id: string; to_block_id: string; label?: string }[]
```

---

## `api.whatsapp`

| Método | Descrição |
|--------|-----------|
| `sendMessage(restaurantId, phone, message)` | Envia mensagem WhatsApp via Z-API |
| `getConfig(restaurantId)` | Config Z-API do restaurante |
| `saveConfig(restaurantId, token, instanceId, secret?)` | Salva config Z-API |
| `getWebhookUrl(restaurantId?)` | URL do webhook WhatsApp |

---

## `api.n8n`

| Método | Descrição |
|--------|-----------|
| `listWebhooks(restaurantId)` | Webhooks n8n configurados |
| `createWebhook(restaurantId, event, url, headers?)` | Cria webhook n8n |
| `toggleWebhook(id, active)` | Ativa/desativa webhook |
| `deleteWebhook(id)` | Remove webhook |
| `triggerEvent(restaurantId, event, payload?)` | Dispara evento manualmente |
| `processQueue(restaurantId?)` | Processa fila de automação |
| `dispatchDirect(restaurantId, event, payload?)` | Dispatch direto (fetch) |
| `dispatchQueue(restaurantId?, limit?)` | Processa fila pendente |

### Eventos n8n disponíveis

```
order_created | order_status_changed | new_conversation
new_customer  | payment_received     | delivery_assigned
```

### Payload padrão

```json
{
  "event": "order_created",
  "restaurant_id": "uuid",
  "timestamp": "2026-01-01T00:00:00Z",
  "entity_id": "uuid",
  "data": {}
}
```

---

## `api.notifications`

| Método | Descrição |
|--------|-----------|
| `listPending(restaurantId?)` | Notificações pendentes |
| `send(restaurantId, phone, message, opts?)` | Enfileira notificação |
| `markSent(id, sentAt?)` | Marca como enviada |
| `markFailed(id, error)` | Marca como falha |
| `processPending(limit?)` | Processa fila de notificações |

### `send — opts`

```ts
{
  type?: string;
  conversationId?: string;
  priority?: number;      // 0-3
  metadata?: Record<string, unknown>;
}
```

---

## `api.master`

| Método | Descrição |
|--------|-----------|
| `restaurantsSummary()` | Sumário de todos restaurantes |
| `platformRevenue(days?)` | Receita da plataforma |
| `restaurantDetail(id)` | Detalhe do restaurante |
| `updatePlan(id, plan)` | Altera plano |
| `toggleRestaurant(id, active)` | Ativa/desativa restaurante |
| `listPeddiTeam()` | Equipe Peddi |
| `addPeddiMember(data)` | Adiciona membro |
| `removePeddiMember(id)` | Remove membro |
| `globalStats()` | Estatísticas globais |

---

## `api.admin`

| Método | Descrição |
|--------|-----------|
| `createUser(data)` | Cria usuário (email, password, name, role, restaurantId, type, shift) |
| `getUsers(restaurantId)` | Lista usuários do restaurante |

---

## `api.restaurant`

| Método | Descrição |
|--------|-----------|
| `get(restaurantId)` | Dados do restaurante |
| `update(restaurantId, data)` | Atualiza restaurante |
| `uploadLogo(restaurantId, file)` | Upload da logo |

---

## `api.storage`

| Método | Descrição |
|--------|-----------|
| `uploadMenuImage(restaurantId, file, itemId?)` | Upload imagem do cardápio |
| `deleteMenuImage(path)` | Remove imagem |

---

## Supabase Realtime (subscriptions)

```ts
import { supabase } from "@/lib/supabase";

// Orders tempo real
supabase.channel("orders").on(
  "postgres_changes",
  { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${id}` },
  (payload) => { /* new, update, delete */ }
).subscribe();

// Conversations tempo real
supabase.channel("conversations").on(
  "postgres_changes",
  { event: "*", schema: "public", table: "conversations", filter: `restaurant_id=eq.${id}` },
  (payload) => {}
).subscribe();

// Messages tempo real
supabase.channel("messages").on(
  "postgres_changes",
  { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
  (payload) => {}
).subscribe();
```

---

## Banco de Dados — 30 Tabelas

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuário (owner, delivery, presencial, master) |
| `restaurants` | Restaurantes |
| `restaurant_settings` | Configurações (horários, pagamentos, WhatsApp, tom chatbot) |
| `menu_categories` | Categorias do cardápio |
| `menu_items` | Itens do cardápio |
| `customers` | Clientes |
| `orders` | Pedidos |
| `order_items` | Itens do pedido |
| `conversations` | Conversas |
| `messages` | Mensagens |
| `delivery_tracking` | Tracking de entregas |
| `payment_methods` | Métodos de pagamento |
| `owner_flows` | Fluxos de automação |
| `flow_templates` | Templates de fluxo |
| `flow_blocks` | Blocos de fluxo |
| `flow_connections` | Conexões entre blocos |
| `conversation_flow_state` | Estado do fluxo por conversa |
| `attendants` | Atendentes |
| `n8n_webhooks` | Webhooks n8n |
| `automation_queue` | Fila de automação |
| `whatsapp_notification_queue` | Fila de notificações WhatsApp |
| `zapi_config` | Configuração Z-API |
| `sales_summary` | Resumo de vendas |
| `order_logs` | Logs de pedidos |
| `restaurant_reports` | Relatórios |
| `peddi_team` | Equipe Peddi (master) |
| `subscription_plans` | Planos de assinatura |
| `plan_features` | Features por plano |
| `audit_log` | Log de auditoria |
| `activity_log` | Log de atividades |

---

## Funções RPC (38 total)

| Função | Descrição |
|--------|-----------|
| `update_order_status` | Valida e atualiza status do pedido |
| `assign_delivery_safe` | Atribui entregador + tracking |
| `complete_delivery_safe` | Finaliza entrega |
| `create_order_with_items_safe` | Cria pedido + itens em 1 transação |
| `get_menu_with_categories` | Cardápio agrupado por categoria |
| `get_dashboard_stats` | Estatísticas do dashboard |
| `get_conversations_with_last_message` | Conversas com última mensagem |
| `get_order_report` | Relatório de pedidos |
| `get_customer_analytics` | Analytics de clientes |
| `get_menu_performance` | Performance do cardápio |
| `get_delivery_performance` | Performance de entregas |
| `get_financial_report` | Relatório financeiro |
| `get_global_stats` | Estatísticas globais |
| `get_all_restaurants_summary` | Sumário de restaurantes |
| `get_platform_revenue` | Receita da plataforma |
| `get_restaurant_detail` | Detalhe do restaurante |
| `get_summary_report` | Relatório sumarizado |
| `get_daily_revenue` | Receita diária |
| `get_top_items` | Itens mais vendidos |
| `get_attendant_performance` | Performance de atendentes |
| `execute_flow_block_action` | Executa ação de bloco |
| `get_next_flow_block` | Próximo bloco no fluxo |
| `start_flow_for_conversation` | Inicia fluxo para conversa |
| `process_flow_input` | Processa input no fluxo |
| `send_whatsapp_notification` | Envia notificação WhatsApp |
| `process_pending_notifications` | Processa fila de notificações |
| `clone_flow_template` | Clona template para restaurante |
| `handle_new_order` | Handler de novo pedido |
| `handle_order_status_change` | Handler de mudança de status |
| `handle_new_conversation` | Handler de nova conversa |
| `handle_new_customer` | Handler de novo cliente |
| `handle_payment_received` | Handler de pagamento |
| `handle_delivery_assigned` | Handler de entrega atribuída |
| `upsert_restaurant_settings` | Cria/atualiza settings |
| `increment_sales` | Incrementa vendas |
| `log_activity` | Registra atividade |
| `log_audit` | Registra auditoria |
| `get_user_by_restaurant` | Usuários por restaurante |

---

## Edge Functions (3)

| Edge Function | Rota | Descrição |
|---------------|------|-----------|
| `n8n-webhook` | `/functions/v1/n8n-webhook` | Recebe eventos do n8n e roteia |
| `whatsapp-webhook` | `/functions/v1/whatsapp-webhook` | Webhook Z-API para mensagens recebidas |
| `zapi-proxy` | `/functions/v1/zapi-proxy` | Proxy para API Z-API |

---

## Triggers do Banco (17)

| Trigger | Tabela | Evento | Ação |
|---------|--------|--------|------|
| `trg_auto_provision_restaurant` | `restaurants` | AFTER INSERT | Cria settings + clona templates |
| `trg_queue_order_created` | `orders` | AFTER INSERT | Insere na automation_queue |
| `trg_queue_order_status` | `orders` | AFTER UPDATE | Insere na automation_queue |
| `trg_queue_new_conversation` | `conversations` | AFTER INSERT | Insere na automation_queue |
| `trg_queue_new_customer` | `customers` | AFTER INSERT | Insere na automation_queue |
| `trg_queue_payment` | `orders` | AFTER UPDATE | Insere na automation_queue |
| `trg_auto_process_flow` | `messages` | AFTER INSERT | Processa fluxo ativo |
| `trg_auto_start_flow_on_order` | `orders` | AFTER INSERT | Inicia fluxo configurado |
| `trg_notify_admin_new_order` | `orders` | AFTER INSERT | Enfileira notificação admin |
| `trg_notify_customer_order_status` | `orders` | AFTER UPDATE | Notifica cliente |
| `trg_notify_delivery_assigned` | `orders` | AFTER UPDATE | Notifica entregador |
| `trg_update_customer_on_order` | `orders` | AFTER INSERT | Atualiza total_orders/spent |
| `trg_setup_default` | `restaurants` | AFTER INSERT | Configurações padrão |
| `trg_setup_whatsapp` | `restaurants` | AFTER INSERT | Config WhatsApp default |
| `trg_setup_team` | `restaurants` | AFTER INSERT | Cria equipe inicial |
| `trg_log_order` | `orders` | AFTER INSERT/UPDATE | Log de pedidos |
| `trg_activity_log` | various | AFTER INSERT/UPDATE/DELETE | Log de atividades |

---

## Deploy

### Vercel
```bash
# Env vars no dashboard da Vercel:
VITE_SUPABASE_URL=https://sqclpeyoimddjcrfcrmi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Netlify
```bash
# Env vars no dashboard da Netlify:
VITE_SUPABASE_URL=https://sqclpeyoimddjcrfcrmi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Build manual
```bash
npm install
npm run build   # ou: node node_modules/vite/bin/vite.js build
```

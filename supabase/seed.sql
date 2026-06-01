-- ============================================================
-- PEDDI - SEED DATA (Painel Admin)
-- Exemplo: Burger House
-- ============================================================

-- 1. RESTAURANT
INSERT INTO restaurants (id, name, slug, phone, email, cuisine_type, service_type, business_hours, working_days, bot_tone, plan, whatsapp_number)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Burger House',
  'burger-house',
  '+55 11 99999-9999',
  'contato@burgerhouse.com',
  '{"Hambúrgueres", "Porções"}',
  'both',
  '{"abre": "10:00", "fecha": "23:00"}',
  '{"Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"}',
  'friendly',
  'pro',
  '+5511999999999'
);

-- 2. SETTINGS
INSERT INTO restaurant_settings (restaurant_id, business_hours, working_days, payment_methods, notifications)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '{"abre": "10:00", "fecha": "23:00"}',
  '{"Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"}',
  '{"pix", "card", "cash"}',
  '{"push": true, "email": false, "whatsapp": true}'
);

-- 3. MENU CATEGORIES
INSERT INTO menu_categories (id, restaurant_id, name, emoji, sort_order) VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Hambúrgueres', '🍔', 1),
  ('a1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Combos', '🍟', 2),
  ('a1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'Bebidas', '🥤', 3),
  ('a1111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 'Porções', '🧅', 4);

-- 4. MENU ITEMS
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, available, featured, upsell, sales_count, sort_order) VALUES
  ('b1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Smash Burger', 'Pão brioche + cheddar + blend 150g', 29.90, true, true, false, 48, 1),
  ('b1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'X-Bacon', 'Pão, bacon crocante, queijo e salada', 34.00, true, false, false, 27, 2),
  ('b1111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'X-Tudo', 'Tudo que tem direito!', 38.90, false, false, false, 15, 3),
  ('b1111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111112', 'Combo Peddi', 'Smash + batata + bebida', 44.90, true, true, false, 31, 1),
  ('b1111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111112', 'Combo Família', '4 burgers + 2 batatas + 4 bebidas', 89.90, true, false, false, 12, 2),
  ('b1111111-1111-1111-1111-111111111106', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111113', 'Coca-Cola', 'Lata 350ml', 7.90, true, false, false, 19, 1),
  ('b1111111-1111-1111-1111-111111111107', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111113', 'Guaraná', 'Lata 350ml', 6.90, true, false, false, 14, 2),
  ('b1111111-1111-1111-1111-111111111108', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111113', 'Milkshake', 'Chocolate, morango ou baunilha', 16.90, true, false, false, 22, 3),
  ('b1111111-1111-1111-1111-111111111109', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111114', 'Batata Frita', 'Porção 300g com cheddar e bacon', 12.90, true, false, false, 35, 1),
  ('b1111111-1111-1111-1111-111111111110', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111114', 'Onion Rings', 'Porção 200g com molho especial', 14.90, false, false, false, 8, 2);

-- 5. CUSTOMERS
INSERT INTO customers (id, restaurant_id, name, phone, total_orders, total_spent, last_order_at, status, favorites) VALUES
  ('c1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'João Silva', '+55 11 99999-0001', 12, 847.00, now() - interval '1 day', 'recorrente', '["Smash Burger", "Coca-Cola"]'),
  ('c1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'Maria Luísa', '+55 11 99999-0002', 8, 624.00, now(), 'recorrente', '["X-Bacon", "Batata Frita"]'),
  ('c1111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111111', 'Carlos Mendes', '+55 11 99999-0003', 3, 189.00, now() - interval '3 days', 'novo', '["Combo Peddi"]'),
  ('c1111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111111', 'Ana Paula', '+55 11 99999-0004', 1, 44.90, now() - interval '14 days', 'inativo', '["Combo Peddi"]'),
  ('c1111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111111', 'Rafael Santos', '+55 11 99999-0005', 15, 1120.00, now() - interval '1 day', 'recorrente', '["Smash Burger", "Milkshake"]'),
  ('c1111111-1111-1111-1111-111111111106', '11111111-1111-1111-1111-111111111111', 'Camila Oliveira', '+55 11 99999-0006', 2, 98.00, now() - interval '7 days', 'novo', '["X-Bacon"]');

-- 6. ORDERS (exemplo do kanban)
INSERT INTO orders (id, restaurant_id, customer_id, channel, type, status, items, total, created_at) VALUES
  ('d1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111101', 'whatsapp', 'delivery', 'new',
    '[{"name": "Smash Burger", "qty": 2, "price": 29.90}, {"name": "Coca-Cola", "qty": 1, "price": 7.90}]',
    67.70, now()),
  ('d1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111102', 'whatsapp', 'delivery', 'confirmed',
    '[{"name": "X-Bacon", "qty": 1, "price": 34.00}, {"name": "Batata Frita", "qty": 1, "price": 12.90}]',
    46.90, now() - interval '5 minutes'),
  ('d1111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111103', 'whatsapp', 'retirada', 'preparing',
    '[{"name": "Combo Peddi", "qty": 1, "price": 44.90}]',
    44.90, now() - interval '12 minutes'),
  ('d1111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111104', 'presencial', 'presencial', 'ready',
    '[{"name": "Smash Burger", "qty": 1, "price": 29.90}]',
    29.90, now() - interval '18 minutes'),
  ('d1111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111105', 'whatsapp', 'delivery', 'delivery',
    '[{"name": "Smash Burger", "qty": 3, "price": 29.90}, {"name": "Milkshake", "qty": 2, "price": 16.90}]',
    123.50, now() - interval '25 minutes'),
  ('d1111111-1111-1111-1111-111111111106', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111106', 'whatsapp', 'delivery', 'completed',
    '[{"name": "X-Bacon", "qty": 2, "price": 34.00}]',
    68.00, now() - interval '40 minutes');

-- 7. CONVERSATIONS
INSERT INTO conversations (id, restaurant_id, customer_id, status, mode, unread_count, last_message_at) VALUES
  ('e1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111101', 'open', 'bot', 2, now()),
  ('e1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111102', 'open', 'attendant', 0, now() - interval '10 minutes'),
  ('e1111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111103', 'open', 'bot', 1, now() - interval '25 minutes'),
  ('e1111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111104', 'open', 'bot', 0, now() - interval '40 minutes');

-- 8. MESSAGES
INSERT INTO messages (id, conversation_id, sender, text, created_at) VALUES
  -- Conversa 1: João Silva (novo pedido)
  ('f1111111-1111-1111-1111-111111111101', 'e1111111-1111-1111-1111-111111111101', 'client', 'Boa noite! Quero fazer um pedido', now() - interval '10 minutes'),
  ('f1111111-1111-1111-1111-111111111102', 'e1111111-1111-1111-1111-111111111101', 'bot', 'Olá João! 😊 Bem-vindo ao Burger House! Aqui está nosso cardápio:', now() - interval '10 minutes'),
  ('f1111111-1111-1111-1111-111111111103', 'e1111111-1111-1111-1111-111111111101', 'client', 'Quero 2 smash burgers e uma coca', now() - interval '8 minutes'),
  ('f1111111-1111-1111-1111-111111111104', 'e1111111-1111-1111-1111-111111111101', 'bot', 'Perfeito! Seu pedido:\n2x Smash Burger - R$59,80\n1x Coca-Cola - R$7,90\nTotal: R$67,70\n\nConfirma?', now() - interval '8 minutes'),
  -- Conversa 2: Maria Luísa (entregue)
  ('f1111111-1111-1111-1111-111111111105', 'e1111111-1111-1111-1111-111111111102', 'client', 'Meu pedido já saiu?', now() - interval '12 minutes'),
  ('f1111111-1111-1111-1111-111111111106', 'e1111111-1111-1111-1111-111111111102', 'attendant', 'Sim, Maria! Seu pedido está a caminho 🛵', now() - interval '11 minutes'),
  ('f1111111-1111-1111-1111-111111111107', 'e1111111-1111-1111-1111-111111111102', 'client', 'Obrigada!', now() - interval '10 minutes'),
  -- Conversa 3: Carlos Mendes (aguardando)
  ('f1111111-1111-1111-1111-111111111108', 'e1111111-1111-1111-1111-111111111103', 'client', 'Oi, boa noite!', now() - interval '27 minutes'),
  ('f1111111-1111-1111-1111-111111111109', 'e1111111-1111-1111-1111-111111111103', 'bot', 'Olá Carlos! Como posso ajudar? 😊', now() - interval '27 minutes'),
  ('f1111111-1111-1111-1111-111111111110', 'e1111111-1111-1111-1111-111111111103', 'client', 'Vocês aceitam PIX?', now() - interval '25 minutes'),
  -- Conversa 4: Ana Paula (preparando)
  ('f1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111104', 'client', 'Quero o combo especial', now() - interval '42 minutes'),
  ('f1111111-1111-1111-1111-111111111112', 'e1111111-1111-1111-1111-111111111104', 'bot', 'Ótima escolha! Combo Peddi saindo! 🍔', now() - interval '42 minutes');

-- 9. AUTOMATION FLOWS
INSERT INTO automation_flows (id, restaurant_id, name, description, icon, category, status, active, stats_triggered, stats_responded, stats_ordered, stats_revenue) VALUES
  ('a1111111-1111-1111-1111-111111111201', '11111111-1111-1111-1111-111111111111', 'Atendimento automático', 'Responde clientes no WhatsApp com seu cardápio', '🤖', 'atendimento', 'active', true, 234, 187, 156, 12400.00),
  ('a1111111-1111-1111-1111-111111111202', '11111111-1111-1111-1111-111111111111', 'Recuperação de clientes', 'Mensagem para clientes inativos há 7 dias', '📢', 'remarketing', 'active', true, 47, 12, 8, 487.00),
  ('a1111111-1111-1111-1111-111111111203', '11111111-1111-1111-1111-111111111111', 'Upsell automático', 'Sugere complementos aumentando ticket médio', '🎯', 'upsell', 'active', true, 89, 34, 28, 1240.00),
  ('a1111111-1111-1111-1111-111111111204', '11111111-1111-1111-1111-111111111111', 'Promoção fim de semana', 'Oferta toda sexta às 18h', '🎁', 'promocao', 'active', false, 0, 0, 0, 0);

-- ============================================================
-- SEED FAKE DATA - Burger House (admin panel testing)
-- Restaurant ID: 11111111-1111-1111-1111-111111111111
-- ============================================================

-- 1. MORE CUSTOMERS
INSERT INTO customers (id, restaurant_id, name, phone, total_orders, total_spent, last_order_at, status, favorites) VALUES
  ('c2222222-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Roberto Almeida', '+55 11 98888-0001', 22, 1589.00, now() - interval '2 hours', 'recorrente', '["Smash Burger", "Milkshake", "Batata Frita"]'),
  ('c2222222-0002-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Fernanda Lima', '+55 11 98888-0002', 15, 1120.50, now() - interval '1 day', 'recorrente', '["X-Bacon", "Coca-Cola"]'),
  ('c2222222-0003-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Thiago Costa', '+55 11 98888-0003', 8, 567.00, now() - interval '4 hours', 'recorrente', '["Combo Peddi", "Onion Rings"]'),
  ('c2222222-0004-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Larissa Souza', '+55 11 98888-0004', 5, 345.90, now() - interval '3 days', 'recorrente', '["X-Tudo", "Guaraná"]'),
  ('c2222222-0005-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Gustavo Pereira', '+55 11 98888-0005', 3, 198.70, now() - interval '6 days', 'novo', '["Smash Burger"]'),
  ('c2222222-0006-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Amanda Ribeiro', '+55 11 98888-0006', 2, 129.80, now() - interval '5 days', 'novo', '["Combo Família"]'),
  ('c2222222-0007-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Pedro Henrique', '+55 11 98888-0007', 1, 44.90, now() - interval '8 days', 'novo', '["Combo Peddi"]'),
  ('c2222222-0008-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Carla Mendes', '+55 11 98888-0008', 1, 34.00, now() - interval '12 days', 'inativo', '["X-Bacon"]'),
  ('c2222222-0009-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Diego Nunes', '+55 11 98888-0009', 0, 0, NULL, 'novo', '[]'),
  ('c2222222-0010-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'Patrícia Oliveira', '+55 11 98888-0010', 18, 1340.00, now() - interval '1 day', 'recorrente', '["Smash Burger", "Batata Frita", "Milkshake"]'),
  ('c2222222-0011-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Lucas Martins', '+55 11 98888-0011', 10, 780.50, now() - interval '3 hours', 'recorrente', '["X-Bacon", "Coca-Cola", "Batata Frita"]'),
  ('c2222222-0012-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'Vanessa Santos', '+55 11 98888-0012', 4, 290.00, now() - interval '2 days', 'recorrente', '["Combo Peddi"]'),
  ('c2222222-0013-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'Bruno Carvalho', '+55 11 98888-0013', 7, 520.00, now() - interval '1 day', 'recorrente', '["Smash Burger", "Milkshake"]'),
  ('c2222222-0014-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'Tatiane Gomes', '+55 11 98888-0014', 2, 159.80, now() - interval '6 days', 'novo', '["Combo Família", "Coca-Cola"]'),
  ('c2222222-0015-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'Ricardo Barbosa', '+55 11 98888-0015', 0, 0, NULL, 'novo', '[]')
ON CONFLICT (id) DO NOTHING;

-- 3. ORDERS (over past 30 days, various statuses)
INSERT INTO orders (id, restaurant_id, customer_id, customer_name, customer_phone, attendant_id, delivery_person_id, channel, type, status, items, total, payment_method, observation, created_at)
VALUES
  -- Today - new orders
  ('d2222222-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'c2222222-0001-0000-0000-000000000001', 'Roberto Almeida', '+55 11 98888-0001', NULL, NULL, 'whatsapp', 'delivery', 'new', '[{"name":"Smash Burger","qty":2,"price":29.90},{"name":"Batata Frita","qty":1,"price":12.90},{"name":"Coca-Cola","qty":2,"price":7.90}]', 88.50, 'pix', 'Sem cebola no smash', now() - interval '15 minutes'),
  ('d2222222-0002-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'c2222222-0003-0000-0000-000000000003', 'Thiago Costa', '+55 11 98888-0003', '55555555-5555-5555-5555-555555555555', NULL, 'whatsapp', 'delivery', 'new', '[{"name":"Combo Peddi","qty":1,"price":44.90},{"name":"Coca-Cola","qty":1,"price":7.90}]', 52.80, 'card', '', now() - interval '8 minutes'),
  ('d2222222-0003-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'c2222222-0011-0000-0000-000000000011', 'Lucas Martins', '+55 11 98888-0011', NULL, NULL, 'whatsapp', 'presencial', 'new', '[{"name":"X-Bacon","qty":1,"price":34.00},{"name":"Batata Frita","qty":1,"price":12.90},{"name":"Milkshake","qty":1,"price":16.90}]', 63.80, 'pix', 'Para viagem', now() - interval '3 minutes'),

  -- Today - confirmed
  ('d2222222-0004-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'c2222222-0010-0000-0000-000000000010', 'Patrícia Oliveira', '+55 11 98888-0010', '55555555-5555-5555-5555-555555555555', NULL, 'whatsapp', 'delivery', 'confirmed', '[{"name":"Smash Burger","qty":1,"price":29.90},{"name":"Batata Frita","qty":1,"price":12.90},{"name":"Milkshake","qty":1,"price":16.90}]', 59.70, 'card', '', now() - interval '25 minutes'),

  -- Today - preparing
  ('d2222222-0005-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'c2222222-0013-0000-0000-000000000013', 'Bruno Carvalho', '+55 11 98888-0013', NULL, NULL, 'whatsapp', 'delivery', 'preparing', '[{"name":"Smash Burger","qty":2,"price":29.90},{"name":"Milkshake","qty":1,"price":16.90}]', 76.70, 'pix', '', now() - interval '40 minutes'),

  -- Today - ready
  ('d2222222-0006-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'c2222222-0002-0000-0000-000000000002', 'Fernanda Lima', '+55 11 98888-0002', '55555555-5555-5555-5555-555555555555', NULL, 'whatsapp', 'delivery', 'ready', '[{"name":"X-Bacon","qty":1,"price":34.00},{"name":"Coca-Cola","qty":2,"price":7.90}]', 49.80, 'pix', '', now() - interval '1 hour'),

  -- Today - delivery
  ('d2222222-0007-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'c2222222-0012-0000-0000-000000000012', 'Vanessa Santos', '+55 11 98888-0012', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'whatsapp', 'delivery', 'delivery', '[{"name":"Combo Peddi","qty":1,"price":44.90}]', 44.90, 'card', '', now() - interval '1 hour 30 minutes'),

  -- Today - completed
  ('d2222222-0008-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'c2222222-0001-0000-0000-000000000001', 'Roberto Almeida', '+55 11 98888-0001', NULL, '44444444-4444-4444-4444-444444444444', 'whatsapp', 'delivery', 'completed', '[{"name":"Smash Burger","qty":1,"price":29.90},{"name":"Milkshake","qty":1,"price":16.90}]', 46.80, 'pix', '', now() - interval '3 hours'),
  ('d2222222-0009-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'c2222222-0010-0000-0000-000000000010', 'Patrícia Oliveira', '+55 11 98888-0010', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'whatsapp', 'delivery', 'completed', '[{"name":"Combo Peddi","qty":1,"price":44.90},{"name":"Coca-Cola","qty":1,"price":7.90}]', 52.80, 'pix', '', now() - interval '5 hours'),
  ('d2222222-0010-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'c2222222-0011-0000-0000-000000000011', 'Lucas Martins', '+55 11 98888-0011', NULL, NULL, 'whatsapp', 'presencial', 'completed', '[{"name":"X-Bacon","qty":1,"price":34.00},{"name":"Coca-Cola","qty":1,"price":7.90}]', 41.90, 'cash', '', now() - interval '6 hours'),

  -- Yesterday
  ('d2222222-0011-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'c2222222-0002-0000-0000-000000000002', 'Fernanda Lima', '+55 11 98888-0002', '55555555-5555-5555-5555-555555555555', NULL, 'whatsapp', 'delivery', 'completed', '[{"name":"X-Bacon","qty":2,"price":34.00},{"name":"Batata Frita","qty":1,"price":12.90}]', 80.90, 'card', '', now() - interval '1 day'),
  ('d2222222-0012-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'c2222222-0004-0000-0000-000000000004', 'Larissa Souza', '+55 11 98888-0004', NULL, '44444444-4444-4444-4444-444444444444', 'whatsapp', 'delivery', 'completed', '[{"name":"X-Tudo","qty":1,"price":38.90}]', 38.90, 'pix', '', now() - interval '1 day'),
  ('d2222222-0013-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'c2222222-0013-0000-0000-000000000013', 'Bruno Carvalho', '+55 11 98888-0013', NULL, NULL, 'whatsapp', 'delivery', 'cancelled', '[{"name":"Combo Família","qty":1,"price":89.90}]', 89.90, 'pix', 'Cliente desistiu', now() - interval '1 day'),

  -- 2 days ago
  ('d2222222-0014-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'c2222222-0012-0000-0000-000000000012', 'Vanessa Santos', '+55 11 98888-0012', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'whatsapp', 'delivery', 'completed', '[{"name":"Combo Peddi","qty":1,"price":44.90},{"name":"Milkshake","qty":1,"price":16.90}]', 61.80, 'card', '', now() - interval '2 days'),
  ('d2222222-0015-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'c2222222-0005-0000-0000-000000000005', 'Gustavo Pereira', '+55 11 98888-0005', NULL, NULL, 'whatsapp', 'delivery', 'completed', '[{"name":"Smash Burger","qty":2,"price":29.90},{"name":"Coca-Cola","qty":1,"price":7.90}]', 67.70, 'pix', 'Bem passado', now() - interval '2 days'),

  -- 4-7 days ago
  ('d2222222-0016-0000-0000-000000000016', '11111111-1111-1111-1111-111111111111', 'c2222222-0006-0000-0000-000000000006', 'Amanda Ribeiro', '+55 11 98888-0006', NULL, '44444444-4444-4444-4444-444444444444', 'whatsapp', 'delivery', 'completed', '[{"name":"Combo Família","qty":1,"price":89.90}]', 89.90, 'card', '', now() - interval '5 days'),
  ('d2222222-0017-0000-0000-000000000017', '11111111-1111-1111-1111-111111111111', 'c2222222-0014-0000-0000-000000000014', 'Tatiane Gomes', '+55 11 98888-0014', '55555555-5555-5555-5555-555555555555', NULL, 'whatsapp', 'presencial', 'completed', '[{"name":"Combo Família","qty":1,"price":89.90},{"name":"Coca-Cola","qty":1,"price":7.90}]', 97.80, 'debit', '', now() - interval '6 days'),
  ('d2222222-0018-0000-0000-000000000018', '11111111-1111-1111-1111-111111111111', 'c2222222-0007-0000-0000-000000000007', 'Pedro Henrique', '+55 11 98888-0007', NULL, NULL, 'whatsapp', 'delivery', 'completed', '[{"name":"Combo Peddi","qty":1,"price":44.90}]', 44.90, 'pix', '', now() - interval '8 days'),
  ('d2222222-0019-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111', 'c2222222-0008-0000-0000-000000000008', 'Carla Mendes', '+55 11 98888-0008', NULL, '44444444-4444-4444-4444-444444444444', 'whatsapp', 'delivery', 'completed', '[{"name":"X-Bacon","qty":1,"price":34.00}]', 34.00, 'pix', '', now() - interval '12 days'),

  -- More orders for volume
  ('d2222222-0020-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111', 'c2222222-0001-0000-0000-000000000001', 'Roberto Almeida', '+55 11 98888-0001', NULL, '44444444-4444-4444-4444-444444444444', 'whatsapp', 'delivery', 'completed', '[{"name":"Smash Burger","qty":3,"price":29.90},{"name":"Batata Frita","qty":2,"price":12.90}]', 115.50, 'credit', '', now() - interval '3 days'),
  ('d2222222-0021-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111', 'c2222222-0011-0000-0000-000000000011', 'Lucas Martins', '+55 11 98888-0011', '55555555-5555-5555-5555-555555555555', NULL, 'whatsapp', 'presencial', 'completed', '[{"name":"X-Bacon","qty":1,"price":34.00},{"name":"Batata Frita","qty":1,"price":12.90},{"name":"Coca-Cola","qty":1,"price":7.90}]', 54.80, 'cash', '', now() - interval '4 days')
ON CONFLICT (id) DO NOTHING;

-- 4. CONVERSATIONS
INSERT INTO conversations (id, restaurant_id, customer_id, channel, status, mode, unread_count, last_message_at)
VALUES
  ('e2222222-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'c2222222-0001-0000-0000-000000000001', 'whatsapp', 'open', 'bot', 2, now() - interval '2 minutes'),
  ('e2222222-0002-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'c2222222-0003-0000-0000-000000000003', 'whatsapp', 'open', 'attendant', 0, now() - interval '10 minutes'),
  ('e2222222-0003-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'c2222222-0010-0000-0000-000000000010', 'whatsapp', 'open', 'bot', 1, now() - interval '30 minutes'),
  ('e2222222-0004-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'c2222222-0002-0000-0000-000000000002', 'whatsapp', 'closed', 'attendant', 0, now() - interval '3 hours'),
  ('e2222222-0005-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'c2222222-0013-0000-0000-000000000013', 'whatsapp', 'open', 'bot', 3, now() - interval '5 minutes'),
  ('e2222222-0006-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'c2222222-0011-0000-0000-000000000011', 'whatsapp', 'open', 'attendant', 1, now() - interval '15 minutes'),
  ('e2222222-0007-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'c2222222-0005-0000-0000-000000000005', 'whatsapp', 'closed', 'bot', 0, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- 5. MESSAGES
INSERT INTO messages (conversation_id, sender, text, message_type, created_at)
VALUES
  -- Roberto conversation
  ('e2222222-0001-0000-0000-000000000001', 'client', 'Quero fazer um pedido', 'text', now() - interval '10 minutes'),
  ('e2222222-0001-0000-0000-000000000001', 'bot', 'Olá Roberto! 😊 Nosso cardápio:\n1️⃣ Smash Burger - R$29,90\n2️⃣ X-Bacon - R$34,00\n3️⃣ Combo Peddi - R$44,90\n\nDigite o número do que deseja!', 'text', now() - interval '9 minutes'),
  ('e2222222-0001-0000-0000-000000000001', 'client', 'Quero 2 Smash Burger e uma batata', 'text', now() - interval '7 minutes'),
  ('e2222222-0001-0000-0000-000000000001', 'bot', '🛒 Resumo do pedido:\n• 2x Smash Burger - R$59,80\n• 1x Batata Frita - R$12,90\n• 2x Coca-Cola - R$15,80\nTotal: R$88,50\n\nConfirma o pedido? ✅', 'text', now() - interval '6 minutes'),
  ('e2222222-0001-0000-0000-000000000001', 'client', 'Sim, confirmo', 'text', now() - interval '4 minutes'),
  ('e2222222-0001-0000-0000-000000000001', 'bot', '✅ Pedido confirmado! Pagamento via PIX.\nChave: 11999999999\n\nAcompanhe pelo link: burgerhouse.foodwaker.app', 'text', now() - interval '2 minutes'),

  -- Thiago - attendant mode
  ('e2222222-0002-0000-0000-000000000002', 'client', 'Oie, tudo bem?', 'text', now() - interval '20 minutes'),
  ('e2222222-0002-0000-0000-000000000002', 'bot', 'Olá Thiago! 🍔 Tudo sim! Como posso ajudar?', 'text', now() - interval '19 minutes'),
  ('e2222222-0002-0000-0000-000000000002', 'client', 'Queria saber se tem hambúrguer vegano', 'text', now() - interval '18 minutes'),
  ('e2222222-0002-0000-0000-000000000002', 'attendant', 'Olá Thiago! Por enquanto não temos opção vegana, mas posso sugerir o X-Bacon sem bacon?', 'text', now() - interval '15 minutes'),
  ('e2222222-0002-0000-0000-000000000002', 'client', 'Pode ser, vou de X-Bacon então', 'text', now() - interval '12 minutes'),
  ('e2222222-0002-0000-0000-000000000002', 'attendant', 'Perfeito! Já vou preparar 🍔', 'text', now() - interval '10 minutes'),

  -- Patricia - bot
  ('e2222222-0003-0000-0000-000000000003', 'client', 'Boa noite!', 'text', now() - interval '35 minutes'),
  ('e2222222-0003-0000-0000-000000000003', 'bot', 'Boa noite! 🌙 Seja bem-vinda ao Burger House!\n\nPosso ajudar com:\n1️⃣ Ver cardápio\n2️⃣ Fazer pedido\n3️⃣ Falar com atendente', 'text', now() - interval '34 minutes'),
  ('e2222222-0003-0000-0000-000000000003', 'client', 'Quero ver o cardápio', 'text', now() - interval '32 minutes'),
  ('e2222222-0003-0000-0000-000000000003', 'bot', 'Aqui está! 📋\n🍔 Smash Burger - R$29,90\n🍔 X-Bacon - R$34,00\n🍟 Batata Frita - R$12,90\n🥤 Coca-Cola - R$7,90\n🥤 Milkshake - R$16,90', 'text', now() - interval '30 minutes'),

  -- Bruno - recent
  ('e2222222-0005-0000-0000-000000000005', 'client', 'Quero pedir de novo aquele smash', 'text', now() - interval '8 minutes'),
  ('e2222222-0005-0000-0000-000000000005', 'bot', 'Bruno! 🎉 Vou pegar seu pedido anterior:\n2x Smash Burger + 1 Milkshake = R$76,70\n\nPode confirmar? ✅', 'text', now() - interval '7 minutes'),
  ('e2222222-0005-0000-0000-000000000005', 'client', 'Isso mesmo!', 'text', now() - interval '5 minutes'),

  -- Lucas
  ('e2222222-0006-0000-0000-000000000006', 'client', 'Meu pedido demora?', 'text', now() - interval '20 minutes'),
  ('e2222222-0006-0000-0000-000000000006', 'bot', 'Lucas! Seu pedido está em preparo 🍳\nPrevisão: 15 minutos', 'text', now() - interval '19 minutes'),
  ('e2222222-0006-0000-0000-000000000006', 'client', 'Tá bom, obrigado!', 'text', now() - interval '18 minutes'),
  ('e2222222-0006-0000-0000-000000000006', 'attendant', 'Olá Lucas! Seu pedido já saiu pra entrega 🛵', 'text', now() - interval '15 minutes')
;

-- 6. RESTAURANT SETTINGS
INSERT INTO restaurant_settings (restaurant_id, business_hours, working_days, payment_methods, notifications)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '{"abre": "10:00", "fecha": "23:00"}',
  '{"Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"}',
  '{"pix", "card", "cash", "debit"}',
  '{"push": true, "email": false, "whatsapp": true}'
)
ON CONFLICT (restaurant_id) DO UPDATE SET
  payment_methods = EXCLUDED.payment_methods;


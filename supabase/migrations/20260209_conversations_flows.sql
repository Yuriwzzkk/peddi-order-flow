-- Conversations
INSERT INTO public.conversations (id, restaurant_id, customer_id, channel, status, mode, unread_count, last_message_at) VALUES
('e0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000001', 'whatsapp', 'open', 'bot', 2, now() - interval '10 minutes'),
('e0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000004', 'whatsapp', 'open', 'attendant', 0, now() - interval '30 minutes'),
('e0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000002', 'whatsapp', 'closed', 'bot', 0, now() - interval '2 hours'),
('e0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000003', 'whatsapp', 'open', 'bot', 1, now() - interval '25 minutes')
ON CONFLICT (id) DO NOTHING;

-- Messages for conversation 1
INSERT INTO public.messages (conversation_id, sender, text, created_at) VALUES
('e0000001-0000-0000-0000-000000000001', 'client', 'Olá, gostaria de fazer um pedido', now() - interval '30 minutes'),
('e0000001-0000-0000-0000-000000000001', 'bot', 'Olá! Claro, vou te ajudar. O que você gostaria de pedir hoje?', now() - interval '29 minutes'),
('e0000001-0000-0000-0000-000000000001', 'client', 'Quero um Smash Burger e uma Coca', now() - interval '20 minutes'),
('e0000001-0000-0000-0000-000000000001', 'bot', 'Ótima escolha! Seu pedido: 1x Smash Burger (R$29,90) + 1x Coca-Cola Lata (R$5,90). Confirma?', now() - interval '19 minutes'),
('e0000001-0000-0000-0000-000000000001', 'client', 'Sim, confirma', now() - interval '10 minutes');

-- Messages for conversation 2
INSERT INTO public.messages (conversation_id, sender, text, created_at) VALUES
('e0000001-0000-0000-0000-000000000002', 'client', 'Meu pedido já saiu para entrega?', now() - interval '45 minutes'),
('e0000001-0000-0000-0000-000000000002', 'bot', 'Deixe-me verificar o status do seu pedido...', now() - interval '44 minutes'),
('e0000001-0000-0000-0000-000000000002', 'attendant', 'Olá Maria! Seu pedido já está em preparo. Logo sai para entrega!', now() - interval '30 minutes');

-- Automation flows
INSERT INTO public.automation_flows (id, restaurant_id, name, description, icon, category, status, active, config) VALUES
('f0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Atendimento Inicial', 'Saudação automática para novos contatos', '👋', 'atendimento', 'active', true, '{"trigger":"new_conversation","response":"Olá! Bem-vindo ao Burger House! Como podemos ajudar?","delay":0}'::jsonb),
('f0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Fora do Horário', 'Resposta automática fora do horário de funcionamento', '🌙', 'atendimento', 'active', true, '{"trigger":"out_of_hours","response":"Olá! Estamos fora do horário de funcionamento. voltaremos às 10h. Deixe sua mensagem!","delay":0}'::jsonb),
('f0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Recuperação 7 dias', 'Oferta especial para clientes sem pedido há 7 dias', '🎉', 'recuperacao', 'draft', false, '{"trigger":"inactive_7_days","response":"Oi! Sentimos sua falta! Que tal um desconto especial de 10% no seu próximo pedido?","delay":0,"coupon":"VOLTA10"}'::jsonb),
('f0000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Upsell Milkshake', 'Oferta de milkshake após pedido de hambúrguer', '🥤', 'upsell', 'active', true, '{"trigger":"after_order","response":"Que tal adicionar um Milkshake de chocolate por apenas R$16,90?","delay":120,"product_id":"a0000001-0000-0000-0000-000000000006"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

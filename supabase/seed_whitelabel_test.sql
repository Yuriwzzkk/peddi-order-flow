-- ============================================================
-- Test restaurants for White Label (painel não configurado)
-- ============================================================

INSERT INTO restaurants (id, name, slug, phone, email, cuisine_type, service_type, business_hours, working_days, bot_tone, plan, whatsapp_number, painel_configurado)
VALUES
  (
    '22222222-2222-2222-2222-222222222201',
    'La Pizza BH',
    'la-pizza-bh',
    '+55 31 99999-0001',
    'contato@lapizzabh.com.br',
    '{"Pizzas", "Massas"}',
    'both',
    '{"abre": "18:00", "fecha": "23:59"}',
    '{"Ter", "Qua", "Qui", "Sex", "Sab", "Dom"}',
    'friendly',
    'pro',
    '+5531999990001',
    false
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'Sushi Mania CWB',
    'sushi-mania-cwb',
    '+55 41 99999-0002',
    'contato@sushimania.com.br',
    '{"Sushi", "Japonesa"}',
    'delivery',
    '{"abre": "11:30", "fecha": "22:00"}',
    '{"Seg", "Ter", "Qua", "Qui", "Sex", "Sab"}',
    'youthful',
    'starter',
    '+5541999990002',
    false
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'Taco Loco RJ',
    'taco-loco-rj',
    '+55 21 99999-0003',
    'contato@tacolorj.com.br',
    '{"Mexicana", "Porções"}',
    'both',
    '{"abre": "11:00", "fecha": "22:00"}',
    '{"Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"}',
    'friendly',
    'starter',
    '+5521999990003',
    false
  )
ON CONFLICT (id) DO NOTHING;

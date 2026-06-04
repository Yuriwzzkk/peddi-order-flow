-- Verificar atendente e webhook criados
SELECT 'profiles (entrega)' as type, id, name, email, role, type as profile_type
FROM profiles
WHERE email LIKE '%teste%' OR email LIKE 'joao%' OR email LIKE 'maria%';

SELECT 'n8n_webhooks' as type, id, name, webhook_url, trigger_event, active
FROM n8n_webhooks
WHERE name LIKE '%Teste%' OR webhook_url LIKE '%teste%';

SELECT 'restaurants' as type, id, name
FROM restaurants
WHERE name LIKE '%Burger House%';

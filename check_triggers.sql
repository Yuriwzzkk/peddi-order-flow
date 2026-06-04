SELECT
  trigger_schema,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

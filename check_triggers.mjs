// SQL: list all triggers on tables that might be affected
const sql = `
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
`;

import { execSync } from 'child_process';
const output = execSync(`supabase db query --linked -c "${sql.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, { encoding: 'utf8' });
console.log(output);

// Apply migration 009 using the supabase JS client via service role
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://sqclpeyoimddjcrfcrmi.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

const sql = readFileSync('./supabase/migrations/009_multitenant_payments.sql', 'utf8');

// Supabase JS doesn't support multi-statement SQL directly, so we need to split
// But we can use the rpc('exec_sql') if it exists, or use a simpler approach
// Let's try splitting by semicolons and running each statement

// Better: use the connection string
import pg from 'pg';
const { Client } = pg.default || pg;

const connStr = process.env.DATABASE_URL;
if (!connStr) {
  console.error('Set DATABASE_URL env var (postgres connection string from Supabase Settings > Database > Connection string)');
  process.exit(1);
}

const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log('Connected. Running migration...');

try {
  await client.query(sql);
  console.log('Migration applied successfully!');
} catch (e) {
  console.error('Migration failed:', e.message);
} finally {
  await client.end();
}

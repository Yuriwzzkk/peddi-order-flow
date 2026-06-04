import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sqclpeyoimddjcrfcrmi.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxY2xwZXlvaW1kZGpjcmZjcm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTg0ODQsImV4cCI6MjA5NDg5NDQ4NH0.77uHn-8svG99moJIf0dXuHFeprcvcg70nnSqEaFOadQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const { data: profiles } = await supabase
  .from('profiles')
  .select('id, name, email, role, type')
  .or('email.ilike.%teste%,email.ilike.joao%,email.ilike.maria%');
console.log('Profiles encontrados:', profiles?.length);
console.log(JSON.stringify(profiles, null, 2));

const { data: webhooks } = await supabase
  .from('n8n_webhooks')
  .select('id, name, webhook_url, trigger_event, active')
  .or('name.ilike.%Teste%,webhook_url.ilike.%teste%');
console.log('\nN8n webhooks encontrados:', webhooks?.length);
console.log(JSON.stringify(webhooks, null, 2));

const { data: restaurant } = await supabase
  .from('restaurants')
  .select('id, name')
  .ilike('name', '%burger house%');
console.log('\nRestaurants:', restaurant?.length);
console.log(JSON.stringify(restaurant, null, 2));


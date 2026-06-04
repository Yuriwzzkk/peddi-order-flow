import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://sqclpeyoimddjcrfcrmi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxY2xwZXlvaW1kZGpjcmZjcm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTg0ODQsImV4cCI6MjA5NDg5NDQ4NH0.77uHn-8svG99moJIf0dXuHFeprcvcg70nnSqEaFOadQ');
await supabase.auth.signInWithPassword({ email: 'master@peddi.com.br', password: '123456' });
const { data, error } = await supabase.from('payment_intents').select('*').order('created_at', { ascending: false });
console.log('payment_intents total:', data?.length);
console.log(JSON.stringify(data, null, 2));

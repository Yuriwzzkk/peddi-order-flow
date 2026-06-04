import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sqclpeyoimddjcrfcrmi.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxY2xwZXlvaW1kZGpjcmZjcm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTg0ODQsImV4cCI6MjA5NDg5NDQ4NH0.77uHn-8svG99moJIf0dXuHFeprcvcg70nnSqEaFOadQ';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

console.log('Testando syncpay-create-payment edge function...');
const { data, error } = await supabase.functions.invoke('syncpay-create-payment', {
  body: {
    customer_name: 'Carlos Teste',
    customer_email: 'carlos.teste@example.com',
    customer_phone: '11999887766',
    customer_cpf: '12345678900',
    restaurant_name: 'Pizzaria Teste E2E',
    plan: 'starter',
  },
});

console.log('Resultado:');
console.log('  data:', JSON.stringify(data, null, 2));
console.log('  error:', error);

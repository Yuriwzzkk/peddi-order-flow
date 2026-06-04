// Test webhook with real payment intent via edge function
import crypto from 'crypto';

const EDGE_BASE = 'https://sqclpeyoimddjcrfcrmi.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxY2xwZXlvaW1kZGpjcmZjcm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTg0ODQsImV4cCI6MjA5NDg5NDQ4NH0.77uHn-8svG99moJIf0dXuHFeprcvcg70nnSqEaFOadQ';
const SECRET = 'peddi-webhook-secret-2026';
const HEADERS = { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` };

(async () => {
  // 1. Criar payment intent real via edge function
  const createRes = await fetch(`${EDGE_BASE}/syncpay-create-payment`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      restaurant_name: 'Teste Webhook Signature',
      customer_name: 'João Teste',
      customer_email: 'joao.teste@example.com',
      customer_phone: '11999999999',
      customer_cpf: '12345678900',
      plan: 'starter',
    }),
  });
  const createData = await createRes.json();
  console.log('1) Create payment intent:', createRes.status);
  console.log('   identifier:', createData.identifier || createData.payment?.identifier);

  const identifier = createData.identifier || createData.payment?.identifier;
  if (!identifier) {
    console.log('   Erro ao criar:', JSON.stringify(createData).substring(0, 200));
    process.exit(1);
  }

  // 2. Assinatura válida
  const validBody = JSON.stringify({ data: { identifier, status: 'PAID' } });
  const validSig = 'sha256=' + crypto.createHmac('sha256', SECRET).update(validBody).digest('hex');
  const invalidSig = 'sha256=' + crypto.createHmac('sha256', 'wrong').update(validBody).digest('hex');

  // Test 1: assinatura válida
  const r1 = await fetch(`${EDGE_BASE}/syncpay-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-signature': validSig },
    body: validBody,
  });
  const t1 = await r1.text();
  console.log(`\n2) Assinatura válida: HTTP ${r1.status}`);
  console.log(`   ${t1.substring(0, 150)}`);

  // Test 2: assinatura inválida
  const r2 = await fetch(`${EDGE_BASE}/syncpay-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-signature': invalidSig },
    body: validBody,
  });
  const t2 = await r2.text();
  console.log(`\n3) Assinatura inválida: HTTP ${r2.status}`);
  console.log(`   ${t2.substring(0, 150)}`);

  // Test 3: sem assinatura
  const r3 = await fetch(`${EDGE_BASE}/syncpay-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: validBody,
  });
  const t3 = await r3.text();
  console.log(`\n4) Sem assinatura: HTTP ${r3.status}`);
  console.log(`   ${t3.substring(0, 150)}`);

  // Análise
  console.log('\n=== Análise ===');
  if (r1.status === 200 && r2.status === 401 && r3.status === 401) {
    console.log('✅ Validação HMAC-SHA256 funcionando perfeitamente!');
    console.log('   - Assinatura válida: aceita');
    console.log('   - Assinatura inválida: rejeitada');
    console.log('   - Sem assinatura: rejeitada');
  } else if (r1.status === 200 && r2.status === 200 && r3.status === 200) {
    console.log('⚠️  Todos passaram com 200 — secret NÃO está configurado nos secrets do Supabase.');
    console.log('   Para ativar validação: Settings > Edge Functions > Secrets > SYNCPAY_WEBHOOK_SECRET');
  } else {
    console.log('❓ Status inesperado. Verifique logs das edge functions.');
  }
})();

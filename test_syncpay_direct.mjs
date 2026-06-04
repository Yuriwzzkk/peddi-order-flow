// Test SyncPay directly
const SYNCPAY_CLIENT_ID = '9bd9d69c-d42f-4d7d-936d-5c51226f84a7';
const SYNCPAY_CLIENT_SECRET = 'd86751e8-7c2f-4526-ba19-f831cdc61fe0';
const SYNCPAY_BASE_URL = 'https://api.syncpayments.com.br';

console.log('1) Gerando token...');
const tokenRes = await fetch(`${SYNCPAY_BASE_URL}/api/partner/v1/auth-token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: SYNCPAY_CLIENT_ID,
    client_secret: SYNCPAY_CLIENT_SECRET,
  }),
});
console.log('  Status:', tokenRes.status);
const tokenData = await tokenRes.json();
console.log('  Resposta:', JSON.stringify(tokenData, null, 2));

if (!tokenRes.ok) {
  console.log('Falha no token, parando.');
  process.exit(1);
}

const token = tokenData.access_token;

console.log('\n2) Criando cashin de R$ 97 (Starter)...');
const cashinRes = await fetch(`${SYNCPAY_BASE_URL}/api/partner/v1/cash-in`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 97,
    description: 'Peddi STARTER - Pizzaria Teste E2E',
    webhook_url: 'https://sqclpeyoimddjcrfcrmi.supabase.co/functions/v1/syncpay-webhook',
    client: {
      name: 'Carlos Teste',
      cpf: '12345678900',
      email: 'carlos.teste@example.com',
      phone: '11999887766',
    },
  }),
});
console.log('  Status:', cashinRes.status);
const cashinData = await cashinRes.json();
console.log('  Resposta:', JSON.stringify(cashinData, null, 2));

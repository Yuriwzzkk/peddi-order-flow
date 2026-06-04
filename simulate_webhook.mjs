// Simulate webhook callback from SyncPay
const identifier = '716c0b45-abe9-4f53-a1f5-054acb265695';

console.log('Simulando webhook onUpdate PAID para identifier:', identifier);

const webhookPayload = {
  event: "transaction.updated",
  data: {
    identifier,
    status: "PAID",
    amount: 97,
    transaction_date: new Date().toISOString(),
  },
};

const res = await fetch('https://sqclpeyoimddjcrfcrmi.supabase.co/functions/v1/syncpay-webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxY2xwZXlvaW1kZGpjcmZjcm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTg0ODQsImV4cCI6MjA5NDg5NDQ4NH0.77uHn-8svG99moJIf0dXuHFeprcvcg70nnSqEaFOadQ',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxY2xwZXlvaW1kZGpjcmZjcm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTg0ODQsImV4cCI6MjA5NDg5NDQ4NH0.77uHn-8svG99moJIf0dXuHFeprcvcg70nnSqEaFOadQ',
  },
  body: JSON.stringify(webhookPayload),
});
console.log('Status:', res.status);
const data = await res.json();
console.log('Resposta:', JSON.stringify(data, null, 2));


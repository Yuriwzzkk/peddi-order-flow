// Check SyncPay possible URLs
const candidates = [
  'https://api.syncpay.pro',
  'https://api.syncpay.com.br',
  'https://api.syncpay.io',
  'https://syncpay.pro',
  'https://app.syncpay.pro',
  'https://api.syncpayments.com.br',
  'https://api.syncpay.payments',
];

for (const url of candidates) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`${url} -> ${res.status}`);
  } catch (e) {
    console.log(`${url} -> DNS FAILED (${e.cause?.code || e.message?.substring(0, 50)})`);
  }
}

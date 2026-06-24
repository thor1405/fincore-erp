const http = require('http');

async function test() {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fincore.com', password: 'admin' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  const res = await fetch('http://localhost:3001/api/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      date: '2026-06-22',
      amount: 1500,
      recipient: 'Test Vendor',
      method: 'Bank Transfer',
      status: 'Completed'
    })
  });
  const data = await res.json();
  console.log('Payment created:', data);

  const txRes = await fetch('http://localhost:3001/api/transactions', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const txData = await txRes.json();
  console.log('Latest transactions:', txData.slice(0, 2).map(t => ({ id: t.id, desc: t.description, category: t.category, type: t.type, status: t.status })));
}

test().catch(console.error);

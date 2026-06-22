const http = require('http');

const request = (options, data) => new Promise((resolve, reject) => {
  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => resolve({ status: res.statusCode, body }));
  });
  req.on('error', reject);
  if (data) req.write(data);
  req.end();
});

async function run() {
  // Login
  const loginData = JSON.stringify({ email: 'johancolaco100@gmail.com', password: 'password123' });
  const loginRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  }, loginData);
  
  const token = JSON.parse(loginRes.body).token;
  if (!token) throw new Error('No token ' + loginRes.body);
  console.log('Got token');

  // Create Invoice
  const invData = JSON.stringify({ client: 'HTTP Test', amount: 999, date: new Date(), dueDate: new Date(), status: 'Draft' });
  const invRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/invoices',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, invData);
  
  const invoice = JSON.parse(invRes.body);
  console.log('Created Invoice:', invoice.id, 'Status:', invoice.status);

  // Patch Invoice
  const patchData = JSON.stringify({ status: 'Paid' });
  const patchRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/invoices/${invoice.id}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, patchData);
  
  console.log('Patch status code:', patchRes.status);
  console.log('Patch response:', patchRes.body);
}
run().catch(console.error);

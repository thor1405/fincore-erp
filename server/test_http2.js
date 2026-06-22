const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function test() {
  const user = await prisma.user.findFirst();
  console.log('User:', user.email);
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: 'Owner' },
    process.env.JWT_SECRET || 'supersecretjwtkey',
    { expiresIn: '24h' }
  );

  const invoice = await prisma.invoice.create({
    data: { userId: user.id, invoiceId: 'INV-TEST-2', client: 'Test Client', amount: 5000, date: new Date(), dueDate: new Date(), status: 'Draft' }
  });
  console.log('Created Invoice:', invoice.id);
  
  // Now simulate the HTTP PATCH
  const http = require('http');
  const patchData = JSON.stringify({ status: 'Paid' });
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/invoices/${invoice.id}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Status code:', res.statusCode);
      console.log('Response:', body);
    });
  });
  req.on('error', console.error);
  req.write(patchData);
  req.end();
}
test().catch(console.error);

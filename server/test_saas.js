require('dotenv').config();
const { PrismaClient } = require('@prisma/client');


const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst();
  
  if (!user) {
    console.error('No users found in database');
    return;
  }

  console.log('Inserting dummy SaaS transactions...');
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        date: new Date(),
        amount: 15.99,
        type: 'Debit',
        category: 'Software',
        status: 'Completed',
        description: 'Zoom Video Communications'
      },
      {
        userId: user.id,
        date: new Date(),
        amount: 12.00,
        type: 'Debit',
        category: 'Software',
        status: 'Completed',
        description: 'Google Workspace'
      },
      {
        userId: user.id,
        date: new Date(),
        amount: 29.99,
        type: 'Debit',
        category: 'Software',
        status: 'Completed',
        description: 'Mailchimp Monthly'
      }
    ]
  });

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'fincore-secret-key');

  console.log('Calling SaaS Analyzer API (this will use Gemini)...');
  try {
    const saasRes = await fetch('http://localhost:3001/api/saas/analyze', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!saasRes.ok) {
      console.error('API Error:', await saasRes.text());
      return;
    }

    const data = await saasRes.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());

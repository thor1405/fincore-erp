const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Recent transactions:');
  transactions.forEach(t => console.log(t.id, t.type, t.category, t.description, t.status));
}
check().catch(console.error).finally(() => prisma.$disconnect());

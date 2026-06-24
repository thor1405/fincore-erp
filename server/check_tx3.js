const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst();
  const txs = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' }
  });
  console.log('Total transactions for user:', txs.length);
  txs.slice(0, 5).forEach(t => console.log(t.id, t.description, t.amount, t.type));
}
check().catch(console.error).finally(() => prisma.$disconnect());

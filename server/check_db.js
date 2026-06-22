const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: 'desc' },
    take: 5
  });
  console.log('Recent transactions:');
  transactions.forEach(t => console.log(t.id, t.date, t.description, t.amount, t.status));

  const invoices = await prisma.invoice.findMany({
    orderBy: { date: 'desc' },
    take: 5
  });
  console.log('\nRecent invoices:');
  invoices.forEach(i => console.log(i.id, i.invoiceId, i.status, i.amount));
}
check().catch(console.error).finally(() => prisma.$disconnect());

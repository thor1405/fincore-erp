const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('Recent invoices by createdAt:');
  invoices.forEach(i => console.log(i.id, i.invoiceId, i.status, i.amount, i.createdAt));
}
check().catch(console.error).finally(() => prisma.$disconnect());

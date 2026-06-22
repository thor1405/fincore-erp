const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const user = await prisma.user.findFirst();
  console.log('User:', user.email);
  const invoice = await prisma.invoice.create({
    data: { userId: user.id, invoiceId: 'INV-TEST', client: 'Test Client', amount: 5000, date: new Date(), dueDate: new Date(), status: 'Draft' }
  });
  console.log('Created Invoice:', invoice.id);
  
  // Now simulate the patch logic
  const existingInvoice = await prisma.invoice.findUnique({ where: { id: invoice.id } });
  const status = 'Paid';
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status }
  });
  console.log('Updated Invoice status:', updatedInvoice.status);

  if (existingInvoice.status !== 'Paid' && status === 'Paid') {
    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        date: new Date(),
        description: 'Payment for Invoice ' + updatedInvoice.invoiceId + ' (' + updatedInvoice.client + ')',
        amount: updatedInvoice.amount,
        type: 'Credit',
        category: 'Sales',
        status: 'Completed'
      }
    });
    console.log('Created Transaction:', tx.id);
  }
}
test().catch(console.error).finally(() => prisma.$disconnect());

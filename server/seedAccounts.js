const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const existingAccounts = await prisma.account.findMany({ where: { userId: user.id } });
    if (existingAccounts.length === 0) {
      const defaultAccounts = [
        { userId: user.id, name: 'Cash', type: 'Asset' },
        { userId: user.id, name: 'Accounts Receivable', type: 'Asset' },
        { userId: user.id, name: 'Equipment', type: 'Asset' },
        { userId: user.id, name: 'Accounts Payable', type: 'Liability' },
        { userId: user.id, name: 'Bank Loan', type: 'Liability' },
        { userId: user.id, name: 'Owner Equity', type: 'Equity' },
        { userId: user.id, name: 'Sales Revenue', type: 'Revenue' },
        { userId: user.id, name: 'Service Revenue', type: 'Revenue' },
        { userId: user.id, name: 'Payroll Expense', type: 'Expense' },
        { userId: user.id, name: 'Office Expense', type: 'Expense' },
        { userId: user.id, name: 'Software Expense', type: 'Expense' }
      ];
      await prisma.account.createMany({ data: defaultAccounts });
      console.log(`Seeded accounts for user ${user.email}`);
    }
  }
  console.log('Done!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());

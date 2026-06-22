const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { triggerWeeklySummary, triggerOverdueInvoiceAlert } = require('./services/notificationService');

const prisma = new PrismaClient();

const initCronJobs = () => {
  console.log('🕒 Initializing Cron Jobs...');

  // Daily at 9:00 AM - Check for Overdue Invoices
  cron.schedule('0 9 * * *', async () => {
    console.log('🕒 Running Daily Overdue Invoice Check...');
    try {
      const users = await prisma.user.findMany();
      for (const user of users) {
        const overdueInvoices = await prisma.invoice.findMany({
          where: {
            userId: user.id,
            status: { not: 'Paid' },
            dueDate: { lt: new Date() }
          }
        });

        for (const invoice of overdueInvoices) {
          await triggerOverdueInvoiceAlert(user.id, invoice.invoiceId, invoice.client);
        }
      }
    } catch (err) {
      console.error('Failed to run overdue invoice check:', err);
    }
  });

  // Weekly on Saturday at 5:00 PM - Send Weekly Financial Summary
  cron.schedule('0 17 * * 6', async () => {
    console.log('🕒 Running Weekly Financial Summary generation...');
    try {
      const users = await prisma.user.findMany();
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      for (const user of users) {
        // Fetch actual transactions for the last 7 days
        const recentTx = await prisma.transaction.findMany({
          where: {
            userId: user.id,
            date: { gte: lastWeek },
            status: 'Completed'
          }
        });

        let revenue = 0;
        let expenses = 0;

        recentTx.forEach(t => {
          if (t.type === 'Credit') revenue += t.amount;
          if (t.type === 'Debit') expenses += t.amount;
        });

        const weeklyData = {
          revenue: revenue.toFixed(2),
          expenses: expenses.toFixed(2),
          cashFlow: (revenue - expenses).toFixed(2)
        };

        await triggerWeeklySummary(user.id, weeklyData);
      }
    } catch (err) {
      console.error('Failed to generate weekly summary:', err);
    }
  });
};

module.exports = { initCronJobs };

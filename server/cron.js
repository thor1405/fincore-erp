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

  // Weekly on Friday at 5:00 PM - Send Weekly Financial Summary
  cron.schedule('0 17 * * 5', async () => {
    console.log('🕒 Running Weekly Financial Summary generation...');
    try {
      const users = await prisma.user.findMany();
      for (const user of users) {
        // Aggregate weekly data (mock logic for demo purposes)
        const weeklyData = {
          revenue: (Math.random() * 5000 + 1000).toFixed(2),
          expenses: (Math.random() * 3000 + 500).toFixed(2),
          cashFlow: 0
        };
        weeklyData.cashFlow = (weeklyData.revenue - weeklyData.expenses).toFixed(2);

        await triggerWeeklySummary(user.id, weeklyData);
      }
    } catch (err) {
      console.error('Failed to generate weekly summary:', err);
    }
  });
};

module.exports = { initCronJobs };

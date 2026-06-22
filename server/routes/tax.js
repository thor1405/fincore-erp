const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { requireWriteAccess } = require('../middleware/rbac');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

// Get tax summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch settings for estimated tax rate
    const settings = await prisma.settings.findUnique({
      where: { userId }
    });
    const taxRate = settings?.estimatedTaxRate || 20;

    // Calculate total net profit
    const transactions = await prisma.transaction.findMany({
      where: { userId }
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      if (t.type === 'Credit') totalIncome += t.amount;
      // Exclude tax payments from operating expenses to calculate pre-tax profit
      if (t.type === 'Debit' && t.category !== 'Taxes') totalExpense += t.amount;
    });

    const netProfit = totalIncome - totalExpense;
    const estimatedTaxLiability = netProfit > 0 ? (netProfit * (taxRate / 100)) : 0;

    // Get total taxes paid
    const taxPayments = await prisma.taxPayment.findMany({
      where: { userId }
    });

    const totalTaxPaid = taxPayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      taxRate,
      totalIncome,
      totalExpense,
      netProfit,
      estimatedTaxLiability,
      totalTaxPaid,
      remainingTaxDue: estimatedTaxLiability - totalTaxPaid,
      payments: taxPayments
    });
  } catch (error) {
    console.error('Error fetching tax summary:', error);
    res.status(500).json({ error: 'Failed to fetch tax summary' });
  }
});

// Update estimated tax rate
router.put('/rate', authenticateToken, async (req, res) => {
  try {
    const { estimatedTaxRate } = req.body;
    
    await prisma.settings.update({
      where: { userId: req.user.userId },
      data: { estimatedTaxRate: parseFloat(estimatedTaxRate) }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tax rate' });
  }
});

// Record a new tax payment
router.post('/payment', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { amount, date, type, description } = req.body;

    const payment = await prisma.taxPayment.create({
      data: {
        userId: req.user.userId,
        amount: parseFloat(amount),
        date: new Date(date),
        type,
        description
      }
    });

    // Also create a corresponding transaction so it reflects in cash flow
    await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        amount: parseFloat(amount),
        date: new Date(date),
        type: 'Debit',
        category: 'Taxes',
        description: `Tax Payment: ${description || type}`,
        status: 'Completed'
      }
    });

    await createAuditLog(req.user.userId, 'RECORDED_TAX_PAYMENT', 'Taxes', `Recorded tax payment of ${amount}`);

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error recording tax payment:', error);
    res.status(500).json({ error: 'Failed to record tax payment' });
  }
});

module.exports = router;

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { requireWriteAccess } = require('../middleware/rbac');
const { createAuditLog } = require('../utils/audit');
const { triggerLargeTransactionAlert, triggerBudgetAlert } = require('../services/notificationService');

const router = express.Router();
const prisma = new PrismaClient();

// Get all transactions for the user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Asynchronous Budget Threshold Monitor
const checkBudgetThreshold = async (userId, category) => {
  if (!category) return;
  try {
    const budget = await prisma.budget.findUnique({
      where: { userId_category: { userId, category } }
    });
    if (!budget) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const spentData = await prisma.transaction.aggregate({
      where: {
        userId,
        category,
        type: 'Debit',
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      _sum: { amount: true }
    });

    const totalSpent = spentData._sum.amount || 0;
    if (totalSpent >= budget.amount) {
      await triggerBudgetAlert(userId, category, totalSpent, budget.amount);
    }
  } catch (err) {
    console.error('Failed to run budget monitor:', err);
  }
};

// Create a new transaction
router.post('/', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { description, amount, type, category, status, date } = req.body;
    
    // Check user settings for approval workflow
    const settings = await prisma.settings.findUnique({ where: { userId: req.user.userId } });
    let finalStatus = status || 'Completed';
    
    const parsedAmount = parseFloat(amount);
    
    if (parsedAmount > 10000 && settings?.pushApprovals) {
      finalStatus = 'Pending Approval';
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        description,
        amount: parsedAmount,
        type,
        category,
        status: finalStatus,
        date: date ? new Date(date) : new Date(),
      },
    });

    await createAuditLog(
      req.user.userId,
      'CREATED_TRANSACTION',
      'Transactions',
      `Created ${type} transaction for ${amount} (${description})`, req.user.actualUserId || req.user.userId
    );

    if (parsedAmount > 10000 && settings?.pushApprovals) {
      await triggerLargeTransactionAlert(req.user.userId, description, parsedAmount);
    }

    if (type === 'Debit') {
      checkBudgetThreshold(req.user.userId, category);
    }

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update a transaction
router.put('/:id', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, type, category, status, date } = req.body;

    // Verify ownership first
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx || tx.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        description,
        amount: parseFloat(amount),
        type,
        category,
        status: status || 'Completed',
        date: date ? new Date(date) : undefined,
      },
    });

    if (tx.category === 'Taxes') {
      const taxPayments = await prisma.taxPayment.findMany({
        where: {
          userId: req.user.userId,
          amount: tx.amount,
          date: tx.date
        }
      });
      if (taxPayments.length > 0) {
        await prisma.taxPayment.update({
          where: { id: taxPayments[0].id },
          data: {
            amount: parseFloat(amount),
            date: date ? new Date(date) : undefined
          }
        });
      }
    }

    await createAuditLog(
      req.user.userId,
      'UPDATED_TRANSACTION',
      'Transactions',
      `Updated ${type} transaction for ${amount} (${description})`, req.user.actualUserId || req.user.userId
    );

    if (type === 'Debit') {
      checkBudgetThreshold(req.user.userId, category);
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete a transaction
router.delete('/:id', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership first
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx || tx.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    if (tx.category === 'Taxes') {
      const taxPayments = await prisma.taxPayment.findMany({
        where: {
          userId: req.user.userId,
          amount: tx.amount,
          date: tx.date
        }
      });
      if (taxPayments.length > 0) {
        await prisma.taxPayment.delete({
          where: { id: taxPayments[0].id }
        });
      }
    }

    const transaction = await prisma.transaction.delete({
      where: { id },
    });

    await createAuditLog(
      req.user.userId,
      'DELETED_TRANSACTION',
      'Transactions',
      `Deleted ${transaction.type} transaction for ${transaction.amount} (${transaction.description})`, req.user.actualUserId || req.user.userId
    );

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Approve a transaction
router.post('/:id/approve', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx || tx.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: { status: 'Completed' }
    });

    await createAuditLog(
      req.user.userId,
      'APPROVED_TRANSACTION',
      'Transactions',
      `Approved transaction ${transaction.id} for ${transaction.amount}`,
      req.user.actualUserId || req.user.userId
    );

    res.json(transaction);
  } catch (error) {
    console.error('Error approving transaction:', error);
    res.status(500).json({ error: 'Failed to approve transaction' });
  }
});

// Reject a transaction
router.post('/:id/reject', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx || tx.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: { status: 'Rejected' }
    });

    await createAuditLog(
      req.user.userId,
      'REJECTED_TRANSACTION',
      'Transactions',
      `Rejected transaction ${transaction.id} for ${transaction.amount}`,
      req.user.actualUserId || req.user.userId
    );

    res.json(transaction);
  } catch (error) {
    console.error('Error rejecting transaction:', error);
    res.status(500).json({ error: 'Failed to reject transaction' });
  }
});

module.exports = router;

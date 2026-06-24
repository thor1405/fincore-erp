const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { requireWriteAccess } = require('../middleware/rbac');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

// Get budgets with spent amounts for current month
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const budgets = await prisma.budget.findMany({
      where: { userId }
    });

    // Calculate start and end of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get all debit transactions for this month for the user
    const spentData = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId,
        type: 'Debit',
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        amount: true
      }
    });

    const spentMap = {};
    spentData.forEach(item => {
      spentMap[item.category] = item._sum.amount || 0;
    });

    const enrichedBudgets = budgets.map(b => ({
      ...b,
      spent: spentMap[b.category] || 0
    }));

    res.json(enrichedBudgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Create a new budget
router.post('/', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { category, amount } = req.body;
    
    // Upsert to handle unique constraint on [userId, category]
    const budget = await prisma.budget.upsert({
      where: {
        userId_category: {
          userId: req.user.userId,
          category
        }
      },
      update: {
        amount: parseFloat(amount)
      },
      create: {
        userId: req.user.userId,
        category,
        amount: parseFloat(amount)
      }
    });

    await createAuditLog(
      req.user.userId,
      'SET_BUDGET',
      'Budgets',
      `Set budget limit of ${amount} for ${category}`,
      req.user.actualUserId || req.user.userId
    );

    res.status(201).json(budget);
  } catch (error) {
    console.error('Error setting budget:', error);
    res.status(500).json({ error: 'Failed to set budget limit' });
  }
});

// Delete a budget
router.delete('/:id', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await prisma.budget.delete({ where: { id } });

    await createAuditLog(
      req.user.userId,
      'DELETED_BUDGET',
      'Budgets',
      `Deleted budget for ${budget.category}`,
      req.user.actualUserId || req.user.userId
    );

    res.json({ message: 'Budget deleted' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

module.exports = router;

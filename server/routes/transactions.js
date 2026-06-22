const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { createAuditLog } = require('../utils/audit');

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

// Create a new transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { description, amount, type, category, status, date } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        description,
        amount: parseFloat(amount),
        type,
        category,
        status: status || 'Completed',
        date: date ? new Date(date) : new Date(),
      },
    });

    await createAuditLog(
      req.user.userId,
      'CREATED_TRANSACTION',
      'Transactions',
      `Created ${type} transaction for ${amount} (${description})`
    );

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update a transaction
router.put('/:id', authenticateToken, async (req, res) => {
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
      `Updated ${type} transaction for ${amount} (${description})`
    );

    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete a transaction
router.delete('/:id', authenticateToken, async (req, res) => {
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
      `Deleted ${transaction.type} transaction for ${transaction.amount} (${transaction.description})`
    );

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

module.exports = router;

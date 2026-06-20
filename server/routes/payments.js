const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all payments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: 'desc' },
    });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Create a payment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, amount, recipient, method, status } = req.body;
    const payment = await prisma.payment.create({
      data: {
        userId: req.user.userId,
        date: new Date(date),
        amount: parseFloat(amount),
        recipient,
        method,
        status: status || 'Completed'
      }
    });
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Update a payment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, amount, recipient, method, status } = req.body;

    const existingPayment = await prisma.payment.findUnique({ where: { id } });
    if (!existingPayment || existingPayment.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Payment not found or unauthorized' });
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: { 
        date: new Date(date), 
        amount: parseFloat(amount), 
        recipient, 
        method, 
        status 
      }
    });

    await createAuditLog(
      req.user.userId,
      'UPDATED_PAYMENT',
      'Payments',
      `Updated payment to ${recipient} for ${amount}`
    );
    
    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Delete a payment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const existingPayment = await prisma.payment.findUnique({ where: { id } });
    if (!existingPayment || existingPayment.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Payment not found or unauthorized' });
    }

    await prisma.payment.delete({
      where: { id }
    });

    await createAuditLog(
      req.user.userId,
      'DELETED_PAYMENT',
      'Payments',
      `Deleted payment to ${existingPayment.recipient}`
    );
    
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

module.exports = router;

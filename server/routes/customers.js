const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { requireWriteAccess } = require('../middleware/rbac');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { userId: req.user.userId },
      orderBy: { name: 'asc' },
    });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Create a customer
router.post('/', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;
    const customer = await prisma.customer.create({
      data: {
        userId: req.user.userId,
        name,
        email,
        phone,
        status: status || 'Active'
      }
    });
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update a customer
router.put('/:id', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, status } = req.body;

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer || existingCustomer.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Customer not found or unauthorized' });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { name, email, phone, status }
    });
    
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Get customer profile (details + invoices)
router.get('/:id/profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer || customer.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Match invoices by customer name since Invoice model stores client as a string
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: req.user.userId,
        client: customer.name
      },
      orderBy: { date: 'desc' }
    });

    const now = new Date();
    let lifetimeValue = 0;
    let overdueAmount = 0;

    invoices.forEach(inv => {
      if (inv.status === 'Paid') {
        lifetimeValue += inv.amount;
      } else if (inv.status !== 'Draft') {
        const isPastDue = new Date(inv.dueDate).getTime() < now.getTime();
        if (inv.status === 'Overdue' || isPastDue) {
          overdueAmount += inv.amount;
        }
      }
    });

    res.json({
      customer,
      metrics: {
        lifetimeValue,
        overdueAmount,
        invoiceCount: invoices.length
      },
      invoices
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ error: 'Failed to fetch customer profile' });
  }
});

// Delete a customer
router.delete('/:id', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer || existingCustomer.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Customer not found or unauthorized' });
    }

    await prisma.customer.delete({
      where: { id }
    });
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;

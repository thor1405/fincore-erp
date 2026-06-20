const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

// Get all invoices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: 'desc' },
    });
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Create an invoice
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { client, amount, date, dueDate, status } = req.body;

    // Generate a simple Invoice ID if none provided
    const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice = await prisma.invoice.create({
      data: {
        userId: req.user.userId,
        invoiceId,
        client,
        amount: parseFloat(amount),
        date: new Date(date),
        dueDate: new Date(dueDate),
        status: status || 'Draft'
      }
    });

    await createAuditLog(
      req.user.userId,
      'CREATED_INVOICE',
      'Invoices',
      `Created invoice ${invoiceId} for ${client}`
    );

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Update an invoice
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { client, amount, date, dueDate, status } = req.body;

    const existingInvoice = await prisma.invoice.findUnique({ where: { id } });
    if (!existingInvoice || existingInvoice.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized' });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { 
        client, 
        amount: parseFloat(amount), 
        date: new Date(date), 
        dueDate: new Date(dueDate), 
        status 
      }
    });

    await createAuditLog(
      req.user.userId,
      'UPDATED_INVOICE',
      'Invoices',
      `Updated invoice ${existingInvoice.invoiceId}`
    );
    
    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Update invoice status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingInvoice = await prisma.invoice.findUnique({ where: { id } });
    if (!existingInvoice || existingInvoice.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized' });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status }
    });

    await createAuditLog(
      req.user.userId,
      'UPDATED_INVOICE_STATUS',
      'Invoices',
      `Marked invoice ${existingInvoice.invoiceId} as ${status}`
    );
    
    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

// Delete an invoice
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const existingInvoice = await prisma.invoice.findUnique({ where: { id } });
    if (!existingInvoice || existingInvoice.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized' });
    }

    await prisma.invoice.delete({
      where: { id }
    });

    await createAuditLog(
      req.user.userId,
      'DELETED_INVOICE',
      'Invoices',
      `Deleted invoice ${existingInvoice.invoiceId}`
    );
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;

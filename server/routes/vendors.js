const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { requireWriteAccess } = require('../middleware/rbac');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

// Get all vendors
router.get('/', authenticateToken, async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { userId: req.user.userId },
      orderBy: { name: 'asc' },
    });
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Create a vendor
router.post('/', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { name, category, contact, status } = req.body;
    const vendor = await prisma.vendor.create({
      data: {
        userId: req.user.userId,
        name,
        category,
        contact,
        status: status || 'Active'
      }
    });
    res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// Update a vendor
router.put('/:id', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, contact, status } = req.body;

    const existingVendor = await prisma.vendor.findUnique({ where: { id } });
    if (!existingVendor || existingVendor.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Vendor not found or unauthorized' });
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: { name, category, contact, status }
    });
    
    res.json(vendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// Get vendor profile (details + payments)
router.get('/:id/profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor || vendor.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Match payments by vendor name
    const payments = await prisma.payment.findMany({
      where: {
        userId: req.user.userId,
        recipient: vendor.name
      },
      orderBy: { date: 'desc' }
    });

    let totalSpend = 0;
    payments.forEach(payment => {
      if (payment.status === 'Completed') {
        totalSpend += payment.amount;
      }
    });

    res.json({
      vendor,
      metrics: {
        totalSpend,
        paymentCount: payments.length
      },
      payments
    });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    res.status(500).json({ error: 'Failed to fetch vendor profile' });
  }
});

// Delete a vendor
router.delete('/:id', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const existingVendor = await prisma.vendor.findUnique({ where: { id } });
    if (!existingVendor || existingVendor.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Vendor not found or unauthorized' });
    }

    await prisma.vendor.delete({
      where: { id }
    });
    
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

module.exports = router;

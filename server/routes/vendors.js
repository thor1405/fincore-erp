const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

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
router.post('/', authenticateToken, async (req, res) => {
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
router.put('/:id', authenticateToken, async (req, res) => {
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

// Delete a vendor
router.delete('/:id', authenticateToken, async (req, res) => {
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

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { requireAdminAccess } = require('../middleware/rbac');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

// Get settings for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { userId: req.user.userId }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId: req.user.userId,
          companyName: 'My Company',
          currency: 'USD'
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.put('/', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { 
      companyName, taxId, email, phone, address, city, state, currency,
      twoFactorEnabled, emailInvoices, emailReports, emailSecurity, pushApprovals, pushOverdue
    } = req.body;
    
    const settings = await prisma.settings.upsert({
      where: { userId: req.user.userId },
      update: {
        companyName, taxId, email, phone, address, city, state, currency,
        twoFactorEnabled, emailInvoices, emailReports, emailSecurity, pushApprovals, pushOverdue
      },
      create: {
        userId: req.user.userId,
        companyName, taxId, email, phone, address, city, state, currency,
        twoFactorEnabled, emailInvoices, emailReports, emailSecurity, pushApprovals, pushOverdue
      }
    });

    await createAuditLog(
      req.user.userId,
      'UPDATED_SETTINGS',
      'Settings',
      'Updated company settings and preferences',
      req.user.actualUserId || req.user.userId
    );

    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;

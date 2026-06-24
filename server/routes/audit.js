const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get audit logs for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 logs
      include: {
        actor: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;

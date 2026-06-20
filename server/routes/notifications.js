const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all notifications for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if user has any notifications. If not, seed a welcome notification.
    const count = await prisma.notification.count({ where: { userId } });
    
    if (count === 0) {
      await prisma.notification.createMany({
        data: [
          {
            userId,
            title: 'Welcome to FinCore ERP!',
            message: 'Your workspace is ready. You can invite team members and manage your business from here.',
            type: 'info'
          },
          {
            userId,
            title: 'Action Required: Connect Bank',
            message: 'Remember to connect your bank account to automate transaction syncing.',
            type: 'alert'
          }
        ]
      });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 for performance
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark a specific notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await prisma.notification.update({
      where: { id, userId },
      data: { isRead: true }
    });

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

module.exports = router;

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all accounts for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user.userId },
      orderBy: { name: 'asc' },
    });
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Create account
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, type } = req.body;
    const account = await prisma.account.create({
      data: {
        userId: req.user.userId,
        name,
        type
      }
    });
    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

module.exports = router;

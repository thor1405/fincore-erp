const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = req.query.q;
    const userId = req.user.userId;

    if (!query || query.trim() === '') {
      return res.json([]);
    }

    const searchStr = query.toLowerCase();

    // Search Transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        OR: [
          { description: { contains: searchStr, mode: 'insensitive' } },
          { category: { contains: searchStr, mode: 'insensitive' } }
        ]
      },
      take: 5,
      orderBy: { date: 'desc' }
    });

    // Search Customers
    const customers = await prisma.customer.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: searchStr, mode: 'insensitive' } },
          { email: { contains: searchStr, mode: 'insensitive' } }
        ]
      },
      take: 5,
      orderBy: { name: 'asc' }
    });

    // Format results
    const formattedResults = [
      ...transactions.map(t => ({
        id: `tx-${t.id}`,
        type: 'transaction',
        title: t.description,
        subtitle: `${t.category} • ${new Date(t.date).toLocaleDateString()}`
      })),
      ...customers.map(c => ({
        id: `c-${c.id}`,
        type: 'customer',
        title: c.name,
        subtitle: c.email || 'No email'
      }))
    ];

    res.json(formattedResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;

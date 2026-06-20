const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all journal entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId: req.user.userId },
      include: {
        lines: {
          include: {
            account: true
          }
        }
      },
      orderBy: { date: 'desc' },
    });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// Create a journal entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, referenceNo, memo, lines } = req.body;

    // Validate debits = credits
    const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ error: 'Debits must equal credits.' });
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId: req.user.userId,
        date: new Date(date),
        referenceNo,
        memo,
        lines: {
          create: lines.map(line => ({
            accountId: line.accountId,
            description: line.description,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0
          }))
        }
      },
      include: {
        lines: true
      }
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// Update a journal entry
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, referenceNo, memo, lines } = req.body;

    const existingEntry = await prisma.journalEntry.findUnique({ where: { id } });
    if (!existingEntry || existingEntry.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Journal entry not found or unauthorized' });
    }

    const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ error: 'Debits must equal credits.' });
    }

    // Delete existing lines
    await prisma.journalLine.deleteMany({
      where: { journalEntryId: id }
    });

    // Update entry and create new lines
    const entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        date: new Date(date),
        referenceNo,
        memo,
        lines: {
          create: lines.map(line => ({
            accountId: line.accountId,
            description: line.description,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0
          }))
        }
      },
      include: {
        lines: true
      }
    });

    res.json(entry);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

// Delete a journal entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const existingEntry = await prisma.journalEntry.findUnique({ where: { id } });
    if (!existingEntry || existingEntry.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Journal entry not found or unauthorized' });
    }

    // Delete child lines first
    await prisma.journalLine.deleteMany({
      where: { journalEntryId: id }
    });

    // Delete parent entry
    await prisma.journalEntry.delete({
      where: { id }
    });
    
    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

module.exports = router;

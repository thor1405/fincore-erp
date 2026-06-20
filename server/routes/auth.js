const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { JWT_SECRET } = require('../middleware/auth');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Seed Default Chart of Accounts
    const defaultAccounts = [
      { userId: user.id, name: 'Cash', type: 'Asset' },
      { userId: user.id, name: 'Accounts Receivable', type: 'Asset' },
      { userId: user.id, name: 'Equipment', type: 'Asset' },
      { userId: user.id, name: 'Accounts Payable', type: 'Liability' },
      { userId: user.id, name: 'Bank Loan', type: 'Liability' },
      { userId: user.id, name: 'Owner Equity', type: 'Equity' },
      { userId: user.id, name: 'Sales Revenue', type: 'Revenue' },
      { userId: user.id, name: 'Service Revenue', type: 'Revenue' },
      { userId: user.id, name: 'Payroll Expense', type: 'Expense' },
      { userId: user.id, name: 'Office Expense', type: 'Expense' },
      { userId: user.id, name: 'Software Expense', type: 'Expense' }
    ];

    await prisma.account.createMany({
      data: defaultAccounts
    });

    // Create default Settings
    await prisma.settings.create({
      data: {
        userId: user.id,
        companyName: 'My Company',
        currency: 'USD'
      }
    });

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    await createAuditLog(
      user.id,
      'USER_LOGIN',
      'Authentication',
      'User logged in successfully'
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Get current user (protected)
const { authenticateToken } = require('../middleware/auth');
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, createdAt: true }
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Check if email is taken by another user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== req.user.userId) {
      return res.status(400).json({ error: 'Email already in use by another account' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, email },
      select: { id: true, email: true, name: true }
    });
    
    await createAuditLog(
      req.user.userId,
      'UPDATED_PROFILE',
      'Profile',
      'Updated user profile information'
    );

    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Change Password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword }
    });

    await createAuditLog(
      req.user.userId,
      'CHANGED_PASSWORD',
      'Security',
      'User changed their password'
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error changing password' });
  }
});

module.exports = router;

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { JWT_SECRET } = require('../middleware/auth');
const { createAuditLog } = require('../utils/audit');
const { triggerSecurityAlert } = require('../services/notificationService');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');

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

    // Check if this user is a team member for someone else
    const teamMember = await prisma.teamMember.findFirst({
      where: { email: user.email, status: 'Active' }
    });

    const workspaceId = teamMember ? teamMember.userId : user.id;

    // Generate token
    const token = jwt.sign({ 
      userId: workspaceId, 
      actualUserId: user.id, 
      email: user.email,
      role: teamMember ? teamMember.role : 'Owner'
    }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: teamMember ? teamMember.role : 'Owner' }
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

    // Find user with settings
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { Settings: true } 
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (user.Settings && user.Settings.twoFactorEnabled) {
      // Return a temporary token for 2FA verification
      const tempToken = jwt.sign({ tempUserId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '5m' });
      return res.json({ requires2FA: true, tempToken });
    }

    // Check if this user is a team member for someone else
    const teamMember = await prisma.teamMember.findFirst({
      where: { email: user.email, status: 'Active' }
    });

    const workspaceId = teamMember ? teamMember.userId : user.id;

    // Generate token
    const token = jwt.sign({ 
      userId: workspaceId, 
      actualUserId: user.id, 
      email: user.email,
      role: teamMember ? teamMember.role : 'Owner'
    }, JWT_SECRET, { expiresIn: '24h' });

    await createAuditLog(
      user.id,
      'USER_LOGIN',
      'Authentication',
      'User logged in successfully'
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: teamMember ? teamMember.role : 'Owner' }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Verify 2FA Login
router.post('/login/verify', async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    
    if (!tempToken || !code) {
      return res.status(400).json({ error: 'Token and code are required' });
    }
    
    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired temporary token' });
    }
    
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.tempUserId },
      include: { Settings: true }
    });
    
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA not properly configured' });
    }
    
    // Verify TOTP code
    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 2FA code' });
    }
    
    // Check if this user is a team member for someone else
    const teamMember = await prisma.teamMember.findFirst({
      where: { email: user.email, status: 'Active' }
    });

    const workspaceId = teamMember ? teamMember.userId : user.id;

    // Generate real token
    const token = jwt.sign({ 
      userId: workspaceId, 
      actualUserId: user.id, 
      email: user.email,
      role: teamMember ? teamMember.role : 'Owner'
    }, JWT_SECRET, { expiresIn: '24h' });

    await createAuditLog(
      user.id,
      'USER_LOGIN_2FA',
      'Authentication',
      'User logged in successfully with 2FA'
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: teamMember ? teamMember.role : 'Owner' }
    });
  } catch (error) {
    console.error('2FA Login error:', error);
    res.status(500).json({ error: 'Error verifying 2FA login' });
  }
});

// Get current user (protected)
const { authenticateToken } = require('../middleware/auth');
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.actualUserId || req.user.userId },
      select: { id: true, email: true, name: true, createdAt: true }
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ ...user, role: req.user.role || 'Owner' });
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
    if (existing && existing.id !== (req.user.actualUserId || req.user.userId)) {
      return res.status(400).json({ error: 'Email already in use by another account' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.actualUserId || req.user.userId },
      data: { name, email },
      select: { id: true, email: true, name: true }
    });
    
    await createAuditLog(
      req.user.actualUserId || req.user.userId,
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
    const user = await prisma.user.findUnique({ where: { id: req.user.actualUserId || req.user.userId } });
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
      where: { id: req.user.actualUserId || req.user.userId },
      data: { password: hashedPassword }
    });

    await createAuditLog(
      req.user.actualUserId || req.user.userId,
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

// --- 2FA Endpoints ---

// Generate 2FA Secret
router.post('/2fa/generate', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.actualUserId || req.user.userId } });
    
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'FinCore ERP', secret);
    
    // Use SVG to completely avoid the fragile node-canvas dependency on Raspberry Pi
    const svgString = await qrcode.toString(otpauthUrl, { type: 'svg' });
    const qrCodeUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    
    res.json({ secret, qrCodeUrl });
  } catch (error) {
    console.error('2FA generate error:', error);
    res.status(500).json({ error: error.message || 'Error generating 2FA secret' });
  }
});

// Verify and Enable 2FA
router.post('/2fa/verify', authenticateToken, async (req, res) => {
  try {
    const { token, secret } = req.body;
    const userId = req.user.actualUserId || req.user.userId;
    
    const isValid = authenticator.verify({ token, secret });
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Save secret and enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret }
    });
    
    await prisma.settings.upsert({
      where: { userId: userId },
      update: { twoFactorEnabled: true },
      create: { userId: userId, twoFactorEnabled: true }
    });
    
    await createAuditLog(userId, 'ENABLED_2FA', 'Security', 'User enabled Two-Factor Authentication');
    await triggerSecurityAlert(userId, 'Two-Factor Authentication was enabled on your account.');
    
    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ error: error.message || 'Error verifying 2FA' });
  }
});

// Disable 2FA
router.post('/2fa/disable', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.actualUserId || req.user.userId;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }
    
    const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Remove secret and disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null }
    });
    
    await prisma.settings.update({
      where: { userId: userId },
      data: { twoFactorEnabled: false }
    });
    
    await createAuditLog(userId, 'DISABLED_2FA', 'Security', 'User disabled Two-Factor Authentication');
    await triggerSecurityAlert(userId, 'Two-Factor Authentication was disabled on your account.');
    
    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Error disabling 2FA' });
  }
});

module.exports = router;

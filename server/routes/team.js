const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { requireAdminAccess } = require('../middleware/rbac');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

// Get all team members
router.get('/', authenticateToken, async (req, res) => {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: { userId: req.user.userId }
    });
    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Invite a new team member
router.post('/invite', authenticateToken, requireAdminAccess, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    const member = await prisma.teamMember.create({
      data: {
        userId: req.user.userId,
        name,
        email,
        role,
        status: 'Pending'
      }
    });

    await createAuditLog(
      req.user.userId,
      'INVITED_TEAM_MEMBER',
      'Settings',
      `Invited ${email} as ${role}`
    );

    // Generate link dynamically based on the request origin
    const origin = req.headers.origin || req.protocol + '://' + req.get('host');
    const inviteLink = `${origin}/invite/${member.id}`;
    res.status(201).json({ member, inviteLink });
  } catch (error) {
    console.error('Error inviting team member:', error);
    res.status(500).json({ error: 'Failed to invite team member' });
  }
});

// Get invite details (Public)
router.get('/invite/:id', async (req, res) => {
  try {
    const member = await prisma.teamMember.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { name: true, email: true } } }
    });
    if (!member) return res.status(404).json({ error: 'Invite not found' });
    res.json(member);
  } catch (error) {
    console.error('Error fetching invite:', error);
    res.status(500).json({ error: 'Failed to fetch invite details' });
  }
});

// Accept invite (Public)
router.post('/invite/:id/accept', async (req, res) => {
  try {
    const member = await prisma.teamMember.update({
      where: { id: req.params.id },
      data: { status: 'Active' }
    });
    
    await createAuditLog(
      member.userId,
      'ACCEPTED_INVITE',
      'Team',
      `Team member ${member.email} accepted their invitation`
    );

    res.json({ success: true, member });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

module.exports = router;

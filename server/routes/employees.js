const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { requireWriteAccess } = require('../middleware/rbac');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

// Get all employees
router.get('/', authenticateToken, async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { userId: req.user.userId },
      orderBy: { name: 'asc' },
    });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get payroll status
router.get('/payroll-status', authenticateToken, async (req, res) => {
  try {
    const lastRun = await prisma.auditLog.findFirst({
      where: { userId: req.user.userId, action: 'RUN_PAYROLL' },
      orderBy: { createdAt: 'desc' }
    });

    let lastRunDate = null;
    let nextRunDate = new Date();
    
    if (lastRun) {
      lastRunDate = lastRun.createdAt;
      nextRunDate = new Date(lastRun.createdAt);
      nextRunDate.setMonth(nextRunDate.getMonth() + 1);
    } else {
      // Default to next 1st of month if never run
      nextRunDate.setMonth(nextRunDate.getMonth() + 1, 1);
    }

    res.json({ lastRunDate, nextRunDate });
  } catch (error) {
    console.error('Error fetching payroll status:', error);
    res.status(500).json({ error: 'Failed to fetch payroll status' });
  }
});

// Run Payroll
router.post('/run-payroll', authenticateToken, async (req, res) => {
  try {
    // 1. Fetch active employees
    const employees = await prisma.employee.findMany({
      where: { userId: req.user.userId, status: 'Active' }
    });

    if (employees.length === 0) {
      return res.status(400).json({ error: 'No active employees to run payroll for.' });
    }

    // 2. Calculate total monthly payroll
    const totalPayroll = employees.reduce((sum, emp) => sum + (emp.salary / 12), 0);

    // 3. Create a transaction
    await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        description: 'Monthly Payroll Processing',
        amount: parseFloat(totalPayroll),
        type: 'Debit',
        category: 'Payroll',
        status: 'Completed',
        date: new Date(),
      }
    });

    // 4. Create Audit Log to mark it as run
    await createAuditLog(
      req.user.userId,
      'RUN_PAYROLL',
      'Employees',
      `Processed payroll for ${employees.length} employees totaling $${totalPayroll.toFixed(2)}`
    );

    res.json({ message: 'Payroll processed successfully', total: totalPayroll });
  } catch (error) {
    console.error('Error running payroll:', error);
    res.status(500).json({ error: 'Failed to process payroll' });
  }
});

// Create an employee
router.post('/', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { name, role, department, salary, status } = req.body;

    const employee = await prisma.employee.create({
      data: {
        userId: req.user.userId,
        name,
        role,
        department,
        salary: parseFloat(salary),
        status: status || 'Active'
      }
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// Update an employee
router.put('/:id', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, department, salary, status } = req.body;

    const existingEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!existingEmployee || existingEmployee.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Employee not found or unauthorized' });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: { name, role, department, salary: parseFloat(salary), status }
    });
    
    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete an employee
router.delete('/:id', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const existingEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!existingEmployee || existingEmployee.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Employee not found or unauthorized' });
    }

    await prisma.employee.delete({
      where: { id }
    });
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;

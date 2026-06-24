const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { calculateHealthScore } = require('../utils/health');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { timeframe = 'monthly' } = req.query;
    const userId = req.user.userId;
    
    const now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();
    
    if (timeframe === 'daily') {
      startDate.setHours(0, 0, 0, 0);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      prevEndDate = new Date(startDate);
    } else if (timeframe === 'weekly') {
      startDate.setDate(now.getDate() - 7);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      prevEndDate = new Date(startDate);
    } else if (timeframe === 'monthly') {
      startDate.setMonth(now.getMonth() - 1);
      prevStartDate = new Date(startDate);
      prevStartDate.setMonth(prevStartDate.getMonth() - 1);
      prevEndDate = new Date(startDate);
    } else if (timeframe === 'yearly') {
      startDate.setFullYear(now.getFullYear() - 1);
      prevStartDate = new Date(startDate);
      prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
      prevEndDate = new Date(startDate);
    } else {
      startDate = new Date(0);
      prevStartDate = new Date(0);
      prevEndDate = new Date(0);
    }

    const currentTx = await prisma.transaction.findMany({
      where: { userId, date: { gte: startDate }, status: 'Completed' },
      orderBy: { date: 'asc' }
    });

    const previousTx = await prisma.transaction.findMany({
      where: { userId, date: { gte: prevStartDate, lt: prevEndDate }, status: 'Completed' }
    });

    let revenue = 0;
    let expenses = 0;
    const cashFlowMap = {};
    const expenseCategoriesMap = {};

    currentTx.forEach(t => {
      if (t.type === 'Credit') revenue += t.amount;
      if (t.type === 'Debit') {
        expenses += Math.abs(t.amount);
        const cat = t.category || 'Other';
        expenseCategoriesMap[cat] = (expenseCategoriesMap[cat] || 0) + Math.abs(t.amount);
      }
      
      let timeKey = '';
      if (timeframe === 'daily') {
        timeKey = `${t.date.getHours()}:00`;
      } else if (timeframe === 'weekly' || timeframe === 'monthly') {
        timeKey = t.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        timeKey = t.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      if (!cashFlowMap[timeKey]) {
        cashFlowMap[timeKey] = { time: timeKey, in: 0, out: 0, profit: 0, timestamp: t.date.getTime() };
      }
      if (t.type === 'Credit') {
        cashFlowMap[timeKey].in += t.amount;
        cashFlowMap[timeKey].profit += t.amount;
      }
      if (t.type === 'Debit') {
        cashFlowMap[timeKey].out += Math.abs(t.amount);
        cashFlowMap[timeKey].profit -= Math.abs(t.amount);
      }
    });

    let prevRevenue = 0;
    let prevExpenses = 0;
    previousTx.forEach(t => {
      if (t.type === 'Credit') prevRevenue += t.amount;
      if (t.type === 'Debit') prevExpenses += Math.abs(t.amount);
    });

    // Cash should be all-time sum, Profit is just current period
    const allTx = await prisma.transaction.findMany({
      where: { userId, status: 'Completed' }
    });
    let allTimeRevenue = 0;
    let allTimeExpenses = 0;
    allTx.forEach(t => {
      if (t.type === 'Credit') allTimeRevenue += t.amount;
      if (t.type === 'Debit') allTimeExpenses += Math.abs(t.amount);
    });

    const profit = revenue - expenses;
    const cash = allTimeRevenue - allTimeExpenses; 
    const prevProfit = prevRevenue - prevExpenses;
    
    // For cash growth, we need the cash balance at the end of the previous period
    const prevCashTx = allTx.filter(t => t.date < prevEndDate);
    let prevAllTimeRevenue = 0;
    let prevAllTimeExpenses = 0;
    prevCashTx.forEach(t => {
      if (t.type === 'Credit') prevAllTimeRevenue += t.amount;
      if (t.type === 'Debit') prevAllTimeExpenses += Math.abs(t.amount);
    });
    const prevCash = prevAllTimeRevenue - prevAllTimeExpenses;

    const calcGrowth = (curr, prev) => {
      if (prev === 0) return null;
      return ((curr - prev) / prev) * 100;
    };

    const sortedCashFlow = Object.values(cashFlowMap).sort((a, b) => a.timestamp - b.timestamp);
    let cumIn = 0;
    let cumOut = 0;
    let cumProfit = 0;
    const cashFlowData = sortedCashFlow.map(({ timestamp, ...rest }) => {
      cumIn += rest.in;
      cumOut += rest.out;
      cumProfit += rest.profit;
      return {
        ...rest,
        in: cumIn,
        out: cumOut,
        profit: cumProfit
      };
    });
    
    const revSparkline = cashFlowData.map((d, i) => ({ index: i, value: d.in })).slice(-7);
    const expSparkline = cashFlowData.map((d, i) => ({ index: i, value: d.out })).slice(-7);
    const profSparkline = cashFlowData.map((d, i) => ({ index: i, value: d.in - d.out })).slice(-7);
    const cashSparkline = profSparkline;

    const expenseCategories = Object.entries(expenseCategoriesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const invoices = await prisma.invoice.findMany({ where: { userId } });
    let arTotal = 0;
    let arOverdue = 0;
    let overdueCount = 0;
    let pendingCount = 0;
    
    invoices.forEach(inv => {
      if (inv.status !== 'Paid' && inv.status !== 'Draft') {
        arTotal += inv.amount;
        pendingCount++;
        const isPastDue = new Date(inv.dueDate).getTime() < now.getTime();
        if (inv.status === 'Overdue' || isPastDue) {
          arOverdue += inv.amount;
          overdueCount++;
        }
      }
    });

    const pendingPayments = await prisma.payment.findMany({ where: { userId, status: 'Pending' } });
    const apTotal = pendingPayments.reduce((acc, p) => acc + p.amount, 0);
    const upcomingPaymentsCount = pendingPayments.length;

    const recentActivity = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10
    });

    const healthScore = calculateHealthScore(revenue, expenses, prevRevenue, prevExpenses, arOverdue);

    const insights = [];
    
    if (profit < 0) {
      insights.push({ id: 5, text: `Critical Warning: Operating at a net loss of ${Math.abs(profit).toFixed(2)} this period. Expenses exceed revenue.` });
    }

    if (revenue >= prevRevenue && prevRevenue !== 0) {
      insights.push({ id: 1, text: `Revenue increased by ${Math.abs(calcGrowth(revenue, prevRevenue)).toFixed(1)}% this period.` });
    } else if (revenue < prevRevenue && prevRevenue !== 0) {
      insights.push({ id: 1, text: `Revenue dropped by ${Math.abs(calcGrowth(revenue, prevRevenue)).toFixed(1)}% this period.` });
    } else if (revenue > 0 && prevRevenue === 0) {
      insights.push({ id: 1, text: `Revenue generated this period is ${revenue.toFixed(2)}.` });
    }

    if (expenses > prevExpenses && prevExpenses !== 0) {
      insights.push({ id: 2, text: `Warning: Expenses grew by ${Math.abs(calcGrowth(expenses, prevExpenses)).toFixed(1)}%.` });
    } else if (expenses > 0 && prevExpenses === 0) {
      insights.push({ id: 2, text: `Expenses recorded this period total ${expenses.toFixed(2)}.` });
    }

    if (overdueCount > 0) {
      insights.push({ id: 3, text: `${overdueCount} invoices are currently overdue requiring immediate attention.` });
    }

    if (insights.length === 0 || (profit >= 0 && overdueCount === 0 && insights.length === 2 && prevRevenue === 0)) {
      // Clean up the generic messages if everything is genuinely stable
      if (profit >= 0 && overdueCount === 0) {
        insights.length = 0; // Clear the array to show a stable message
        insights.push({ id: 4, text: `Finances are stable. No major alerts this period.` });
      }
    }

    res.json({
      kpis: {
        revenue: { value: revenue, growth: calcGrowth(revenue, prevRevenue), sparkline: revSparkline.length ? revSparkline : [{index:0,value:0}] },
        expenses: { value: expenses, growth: calcGrowth(expenses, prevExpenses), sparkline: expSparkline.length ? expSparkline : [{index:0,value:0}] },
        profit: { value: profit, growth: calcGrowth(profit, prevProfit), sparkline: profSparkline.length ? profSparkline : [{index:0,value:0}] },
        cash: { value: cash, growth: calcGrowth(cash, prevCash), sparkline: cashSparkline.length ? cashSparkline : [{index:0,value:0}] }
      },
      cashFlowData,
      expenseCategories,
      recentTransactions,
      recentActivity,
      ar: { total: arTotal, overdue: arOverdue, overdueCount, pendingCount },
      ap: { total: apTotal, upcomingCount: upcomingPaymentsCount },
      healthScore,
      insights
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;

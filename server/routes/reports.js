const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { calculateHealthScore } = require('../utils/health');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    const currentStart = startDate ? new Date(startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const currentEnd = endDate ? new Date(endDate) : new Date();

    const timeDiff = currentEnd.getTime() - currentStart.getTime();
    const prevStart = new Date(currentStart.getTime() - timeDiff);
    const prevEnd = new Date(currentEnd.getTime() - timeDiff);

    const currentTx = await prisma.transaction.findMany({
      where: { userId, date: { gte: currentStart, lte: currentEnd } },
      orderBy: { date: 'asc' }
    });

    const prevTx = await prisma.transaction.findMany({
      where: { userId, date: { gte: prevStart, lte: prevEnd } }
    });

    let revenue = 0, expenses = 0, cogs = 0;
    const expensesByCategoryMap = {};
    const monthlyDataMap = {};

    currentTx.forEach(t => {
      const monthKey = t.date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = { name: monthKey, Income: 0, Expense: 0, Profit: 0, timestamp: t.date.getTime() };
      }

      if (t.type === 'Credit') {
        revenue += t.amount;
        monthlyDataMap[monthKey].Income += t.amount;
      } else if (t.type === 'Debit') {
        const amt = Math.abs(t.amount);
        expenses += amt;
        monthlyDataMap[monthKey].Expense += amt;
        
        const cat = t.category || 'Other';
        expensesByCategoryMap[cat] = (expensesByCategoryMap[cat] || 0) + amt;
        
        if (cat.toLowerCase().includes('cogs') || cat.toLowerCase().includes('cost of goods')) {
          cogs += amt;
        }
      }
      monthlyDataMap[monthKey].Profit = monthlyDataMap[monthKey].Income - monthlyDataMap[monthKey].Expense;
    });

    let prevRevenue = 0, prevExpenses = 0;
    prevTx.forEach(t => {
      if (t.type === 'Credit') prevRevenue += t.amount;
      else if (t.type === 'Debit') prevExpenses += Math.abs(t.amount);
    });

    const profit = revenue - expenses;
    const prevProfit = prevRevenue - prevExpenses;

    const calcGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const operatingExpenses = expenses - cogs;
    const operatingMargin = revenue > 0 ? ((grossProfit - operatingExpenses) / revenue) * 100 : 0;
    const expenseRatio = revenue > 0 ? (expenses / revenue) * 100 : 0;

    const expensesByCategory = Object.keys(expensesByCategoryMap)
      .map(category => ({ name: category, value: expensesByCategoryMap[category] }))
      .sort((a, b) => b.value - a.value);

    const monthlyData = Object.values(monthlyDataMap).sort((a, b) => a.timestamp - b.timestamp);

    let insights = [];
    // Algorithmic Health Score calculation
    const invoices = await prisma.invoice.findMany({ where: { userId } });
    let arOverdue = 0;
    const now = new Date();
    invoices.forEach(inv => {
      if (inv.status !== 'Paid' && new Date(inv.dueDate) < now && inv.status !== 'Draft') {
        arOverdue += inv.amount;
      }
    });

    const healthScore = calculateHealthScore(revenue, expenses, prevRevenue, prevExpenses, arOverdue);

    // Algorithmic Insights generation
    const revenueGrowth = calcGrowth(revenue, prevRevenue);
    const expenseGrowth = calcGrowth(expenses, prevExpenses);

    if (revenueGrowth > 0) {
      insights.push({ id: 1, text: `Strong performance: Revenue grew by ${revenueGrowth.toFixed(1)}% compared to the previous period.` });
    } else if (revenueGrowth < 0) {
      insights.push({ id: 1, text: `Revenue contracted by ${Math.abs(revenueGrowth).toFixed(1)}%. Consider analyzing sales channels for drop-offs.` });
    } else {
      insights.push({ id: 1, text: `Revenue remained flat compared to the previous period.` });
    }

    if (profitMargin >= 15) {
      insights.push({ id: 2, text: `Healthy margins: Your net profit margin sits at an excellent ${profitMargin.toFixed(1)}%.` });
    } else if (profitMargin > 0) {
      insights.push({ id: 2, text: `Profit margins are tight at ${profitMargin.toFixed(1)}%. Review operating expenses.` });
    } else {
      insights.push({ id: 2, text: `Operating at a loss. Your profit margin is ${profitMargin.toFixed(1)}%.` });
    }

    if (expenseGrowth > revenueGrowth && revenueGrowth > 0) {
      insights.push({ id: 3, text: `Warning: Expenses are growing faster (${expenseGrowth.toFixed(1)}%) than revenue. Keep an eye on overhead.` });
    } else if (expenseRatio > 80) {
      insights.push({ id: 3, text: `High expense ratio: ${expenseRatio.toFixed(1)}% of your revenue is consumed by expenses.` });
    } else {
      insights.push({ id: 3, text: `Expenses are well-managed and proportionate to your revenue growth.` });
    }

    res.json({
      kpis: {
        revenue: { value: revenue, growth: calcGrowth(revenue, prevRevenue) },
        expenses: { value: expenses, growth: calcGrowth(expenses, prevExpenses) },
        profit: { value: profit, growth: calcGrowth(profit, prevProfit) },
        profitMargin: { value: profitMargin, growth: profitMargin - (prevRevenue ? (prevProfit/prevRevenue)*100 : 0) }
      },
      metrics: {
        grossMargin,
        operatingMargin,
        expenseRatio,
        revenueGrowth: calcGrowth(revenue, prevRevenue)
      },
      expensesByCategory,
      monthlyData,
      insights,
      healthScore
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

module.exports = router;

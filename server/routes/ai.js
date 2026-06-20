const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/predict', authenticateToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.userId;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Fetch transactions to build historical context
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'asc' }
    });

    if (transactions.length === 0) {
      return res.json({ 
        response: "I don't see any transaction history yet. Once you start recording income and expenses, I'll be able to predict your future business trends!" 
      });
    }

    // Basic aggregations
    let totalIncome = 0;
    let totalExpense = 0;

    const firstTx = transactions[0].date;
    const lastTx = transactions[transactions.length - 1].date;
    
    // Calculate days between first and last transaction (minimum 1 day)
    const timeDiff = lastTx.getTime() - firstTx.getTime();
    const daysActive = Math.max(Math.ceil(timeDiff / (1000 * 3600 * 24)), 1);

    transactions.forEach(t => {
      if (t.type === 'Credit') totalIncome += t.amount;
      if (t.type === 'Debit') totalExpense += t.amount;
    });

    const netProfit = totalIncome - totalExpense;
    
    // Fetch user settings for currency symbol
    const settings = await prisma.settings.findUnique({ where: { userId } });
    const currency = settings?.currency || 'USD';
    const currencySymbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$', INR: '₹' };
    const curSym = currencySymbols[currency] || '$';

    // Daily Run Rates
    const dailyIncome = totalIncome / daysActive;
    const dailyExpense = totalExpense / daysActive;
    const dailyProfit = netProfit / daysActive;

    // Monthly Run Rates
    const monthlyIncome = dailyIncome * 30.44;
    const monthlyExpense = dailyExpense * 30.44;
    const monthlyProfit = dailyProfit * 30.44;

    const lowerPrompt = prompt.toLowerCase();
    let responseText = "";

    // Simulated AI Logic parsing the prompt
    if (lowerPrompt.includes('profit')) {
      let monthsToPredict = 1;
      
      // Try to extract a number followed by "month" or "months"
      const match = lowerPrompt.match(/(\d+)\s*month/);
      if (match) {
        monthsToPredict = parseInt(match[1]);
      } else if (lowerPrompt.includes('two')) monthsToPredict = 2;
      else if (lowerPrompt.includes('three')) monthsToPredict = 3;
      else if (lowerPrompt.includes('six')) monthsToPredict = 6;
      else if (lowerPrompt.includes('year') || lowerPrompt.includes('12')) monthsToPredict = 12;
      
      const predictedProfit = monthlyProfit * monthsToPredict;
      
      if (predictedProfit > 0) {
        responseText = `Based on your historical run rate over the last ${daysActive} days, your business generates an average of **${curSym}${monthlyProfit.toFixed(2)}** in net profit per month. \n\nIf this trend continues, your predicted profit for the next **${monthsToPredict} month(s)** will be approximately **${curSym}${predictedProfit.toFixed(2)}**. Keep optimizing those expenses!`;
      } else {
        responseText = `Based on your historical run rate, your business is currently operating at a monthly net loss of **${curSym}${Math.abs(monthlyProfit).toFixed(2)}**. \n\nIf current trends continue for the next **${monthsToPredict} month(s)**, you are predicted to lose approximately **${curSym}${Math.abs(predictedProfit).toFixed(2)}**. I recommend reviewing your primary expense categories.`;
      }
    } 
    else if (lowerPrompt.includes('expense') || lowerPrompt.includes('spending')) {
      responseText = `Your historical data shows an average monthly expense run-rate of **${curSym}${monthlyExpense.toFixed(2)}**. You've spent a total of ${curSym}${totalExpense.toFixed(2)} over ${daysActive} days.`;
    }
    else if (lowerPrompt.includes('income') || lowerPrompt.includes('revenue') || lowerPrompt.includes('sales')) {
      responseText = `Your business has generated ${curSym}${totalIncome.toFixed(2)} over ${daysActive} days. Your projected monthly revenue is currently sitting at **${curSym}${monthlyIncome.toFixed(2)}**.`;
    }
    else {
      // Generic fallback combining everything
      responseText = `I can analyze your trends! Currently, your 30-day projection looks like this:
- **Projected Revenue**: ${curSym}${monthlyIncome.toFixed(2)}
- **Projected Expenses**: ${curSym}${monthlyExpense.toFixed(2)}
- **Projected Net Profit**: ${curSym}${monthlyProfit.toFixed(2)}

Try asking me specific questions like: "How much profit will I make in 3 months?"`;
    }

    await createAuditLog(userId, 'AI_PREDICTION_REQUESTED', 'AI', 'User requested a business prediction');

    res.json({ response: responseText });
  } catch (error) {
    console.error('Error in AI prediction:', error);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
});

module.exports = router;

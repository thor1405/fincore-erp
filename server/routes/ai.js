const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/debug', (req, res) => {
  res.json({ message: "BACKEND_IS_V3" });
});

router.get('/sync-chat', authenticateToken, async (req, res) => {
  try {
    const history = await prisma.aIChatMessage.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, createdAt: true }
    });
    
    if (history.length === 0) {
      return res.json([{
        id: 'debug-fake-id',
        role: 'assistant',
        content: 'Hello! I am FinCore AI, your intelligent financial advisor. How can I help you analyze your finances today?'
      }]);
    }
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching AI history:', error);
    res.status(500).json({ error: 'Failed to fetch AI chat history' });
  }
});

router.post('/predict', authenticateToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.userId;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ 
        response: "To use the AI Predictor, you need to add your free Google Gemini API key to your `.env` file as `GEMINI_API_KEY=your-key` and restart PM2." 
      });
    }

    // Fetch transactions to build historical context
    const transactions = await prisma.transaction.findMany({
      where: { userId, status: 'Completed' },
      orderBy: { date: 'asc' }
    });

    let contextData = "";
    if (transactions.length === 0) {
      contextData = "The user currently has NO transaction history. They have not recorded any income or expenses yet.";
    } else {
      let totalIncome = 0;
      let totalExpense = 0;

      const firstTx = transactions[0].date;
      const lastTx = transactions[transactions.length - 1].date;
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

      // Daily Run Rates
      const dailyIncome = totalIncome / daysActive;
      const dailyExpense = totalExpense / daysActive;
      const dailyProfit = netProfit / daysActive;

      // Monthly Run Rates
      const monthlyIncome = dailyIncome * 30.44;
      const monthlyExpense = dailyExpense * 30.44;
      const monthlyProfit = dailyProfit * 30.44;

      contextData = `User Financial Summary:
- Currency: ${currency}
- Total Income (All Time): ${totalIncome.toFixed(2)}
- Total Expenses (All Time): ${totalExpense.toFixed(2)}
- Net Profit (All Time): ${netProfit.toFixed(2)}
- Days of Data: ${daysActive}
- Average Monthly Projected Revenue: ${monthlyIncome.toFixed(2)}
- Average Monthly Projected Expenses: ${monthlyExpense.toFixed(2)}
- Average Monthly Projected Profit: ${monthlyProfit.toFixed(2)}`;
    }

    const systemInstruction = `You are FinCore AI, a professional, intelligent financial advisor integrated into the FinCore ERP system.
You help business owners analyze their finances, predict trends, and optimize cash flow.
Always be polite, concise, and professional. Do NOT use overly complex jargon unless necessary.
Format your responses using markdown for readability (e.g., bullet points, bold text).
Here is the user's current live financial data context:
${contextData}

Base your predictions and advice ONLY on the context provided above. If they have no data, tell them to start recording transactions.`;

    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Save the user's prompt to the database FIRST
    await prisma.aIChatMessage.create({
      data: { userId, role: 'user', content: prompt }
    });

    // Fetch full history from DB (including the newly saved prompt)
    const dbHistory = await prisma.aIChatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    // Format history for Gemini
    const contents = dbHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const responseText = response.text || "I was unable to generate a prediction at this time.";

    // Save the AI's response to the database
    const savedResponse = await prisma.aIChatMessage.create({
      data: { userId, role: 'assistant', content: responseText }
    });

    await createAuditLog(userId, 'AI_PREDICTION_REQUESTED', 'AI', 'User requested an advanced LLM prediction');

    res.json({ response: responseText, id: savedResponse.id });
  } catch (error) {
    console.error('Error in AI prediction:', error);
    res.status(500).json({ error: 'Failed to process AI request. Check your API key or network connection.' });
  }
});

module.exports = router;

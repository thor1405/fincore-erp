const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { requireWriteAccess } = require('../middleware/rbac');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/analyze', authenticateToken, requireWriteAccess, async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ 
        error: "GEMINI_API_KEY is not configured in the environment.",
        needsApiKey: true
      });
    }

    // Fetch the last 500 Debit transactions
    const expenses = await prisma.transaction.findMany({
      where: { 
        userId, 
        type: 'Debit',
        status: 'Completed'
      },
      orderBy: { date: 'desc' },
      take: 500,
      select: {
        date: true,
        description: true,
        amount: true,
        category: true
      }
    });

    const userSettings = await prisma.settings.findUnique({ where: { userId } });
    const userCurrency = userSettings?.currency || 'USD';

    if (expenses.length === 0) {
      return res.json({ subscriptions: [], totalSaaS: 0, wastedSpend: 0 });
    }

    // Group by description, amount, and date to remove exact accidental duplicates
    // but preserve distinct charges (like different tiers/add-ons to the same vendor)
    const uniqueExpensesMap = new Map();
    for (const e of expenses) {
      const dateStr = e.date.toISOString().split('T')[0];
      const key = `${e.description.toLowerCase().trim()}_${e.amount}_${dateStr}`;
      if (!uniqueExpensesMap.has(key)) {
        uniqueExpensesMap.set(key, e);
      }
    }
    const uniqueExpenses = Array.from(uniqueExpensesMap.values());

    // Format expenses for the prompt
    const expenseData = uniqueExpenses.map(e => 
      `${e.date.toISOString().split('T')[0]} | ${e.description} | ${e.category} | ${e.amount}`
    ).join('\n');

    const systemInstruction = `You are FinCore AI, a top-tier financial auditor and SaaS Leakage Waste Detector.
Your job is to analyze the provided list of unique software expenses and identify recurring SaaS subscriptions.
CRITICAL RULES:
1. If there are multiple distinct charges to the same vendor, COMBINE them into a SINGLE subscription and sum their costs for the 'monthlyCost'. Do not list the same vendor twice.
2. You MUST aggressively flag overlapping software tools. If two tools provide similar functionality (e.g., 'fintech' and 'expense', or 'Zoom' and 'Google Workspace'), mark the cheaper one as overlapping.
3. Set 'isOverlapping' to true for the redundant tool.
4. Calculate the sum of the monthlyCost of all overlapping (redundant) tools and set it as 'wastedSpend'.
5. Calculate the sum of all subscriptions and set it as 'totalSaaS'.

IMPORTANT: The user's currency is ${userCurrency}. When writing the 'aiExplanation', you MUST use the appropriate symbol or abbreviation for ${userCurrency} instead of the $ sign (unless they use USD).

Return a STRICT JSON object in exactly this format, and nothing else:
{
  "totalSaaS": <number total monthly SaaS spend>,
  "wastedSpend": <number estimated monthly wasted spend due to overlaps>,
  "subscriptions": [
    {
      "id": "<generate a random string id>",
      "name": "<Name of software, e.g. Zoom>",
      "monthlyCost": <number>,
      "isOverlapping": <boolean true if overlaps with another service in the list>,
      "overlappingWith": "<name of the other service it overlaps with, or null>",
      "aiExplanation": "<Brief explanation of what this tool is. If overlapping, clearly explain WHY it overlaps and suggest which to keep/cancel.>"
    }
  ]
}

Transactions format: DATE | DESCRIPTION | CATEGORY | AMOUNT`;

    const prompt = `Analyze these transactions and output the JSON:\n${expenseData}`;

    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    let resultJson;
    try {
      resultJson = JSON.parse(response.text);
    } catch (parseError) {
      console.error('Failed to parse AI JSON:', response.text);
      return res.status(500).json({ error: 'AI returned invalid data format' });
    }

    await createAuditLog(userId, 'SAAS_AUDIT_RUN', 'AI', 'User ran the AI SaaS Leakage & Waste Detector');

    res.json(resultJson);
  } catch (error) {
    console.error('Error analyzing SaaS leakage:', error);
    res.status(500).json({ error: 'Failed to process AI SaaS Audit' });
  }
});

module.exports = router;

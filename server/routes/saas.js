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

    if (expenses.length === 0) {
      return res.json({ subscriptions: [], totalSaaS: 0, wastedSpend: 0 });
    }

    // Format expenses for the prompt
    const expenseData = expenses.map(e => 
      `${e.date.toISOString().split('T')[0]} | ${e.description} | ${e.category} | ${e.amount}`
    ).join('\n');

    const systemInstruction = `You are FinCore AI, a top-tier financial auditor and SaaS Leakage Waste Detector.
Your job is to analyze the provided transaction history and identify recurring software subscriptions (SaaS).
You must also flag ANY overlapping software (e.g. paying for both Zoom and Google Meet/Workspace, or Asana and Jira) and calculate estimated wasted spend.

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

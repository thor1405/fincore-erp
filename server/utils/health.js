function calculateHealthScore(revenue, expenses, prevRevenue, prevExpenses, arOverdue = 0) {
    let score = 80;
    const profit = revenue - expenses;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const expenseRatio = revenue > 0 ? (expenses / revenue) * 100 : 0;

    if (profitMargin > 20) score += 10;
    else if (profitMargin < 0) score -= 15;

    if (revenue > prevRevenue) score += 10;
    else if (revenue < prevRevenue && prevRevenue > 0) score -= 10;

    if (expenseRatio > 80) score -= 10;
    else if (expenseRatio < 50) score += 10;

    if (arOverdue > 0) score -= 5;

    return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = { calculateHealthScore };

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AreaChart, BarChart } from '../components/ui/Charts';
import { 
  Download, ArrowUpRight, ArrowDownRight, Sparkles, AlertCircle, 
  TrendingUp, Activity, PieChart as PieChartIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import * as XLSX from 'xlsx';
import styles from './Reports.module.css';

export function Reports() {
  const { token } = useAuth();
  const { formatCurrency } = useSettings();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date range state
  const [dateRange, setDateRange] = useState('monthly'); // 'monthly', 'quarterly', 'yearly', 'all'
  const [customDates, setCustomDates] = useState({ start: '', end: '' });

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let query = `?range=${dateRange}`;
      
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();

      if (dateRange === 'monthly') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (dateRange === 'quarterly') {
        startDate.setMonth(now.getMonth() - 3);
      } else if (dateRange === 'yearly') {
        startDate.setFullYear(now.getFullYear() - 1);
      } else if (dateRange === 'all') {
        startDate = new Date(0);
      } else if (dateRange === 'custom' && customDates.start && customDates.end) {
        startDate = new Date(customDates.start);
        endDate = new Date(customDates.end);
      }

      query = `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;

      const response = await fetch(`/api/reports${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setData(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchReports();
  }, [token, dateRange, customDates]);

  const handleExportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    const monthlyFormatted = data.monthlyData.map(d => ({
      'Month': d.name,
      'Total Income': d.Income,
      'Total Expenses': d.Expense,
      'Net Profit': d.Profit
    }));
    const wsMonthly = XLSX.utils.json_to_sheet(monthlyFormatted);
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Summary');

    const expensesFormatted = data.expensesByCategory.map(e => ({
      'Expense Category': e.name,
      'Total Amount': e.value
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expensesFormatted);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expense Breakdown');

    XLSX.writeFile(wb, `Financial_Reports_${dateRange}.xlsx`);
  };

  const renderKPI = (title, metric, isCurrency = true, invertColors = false) => {
    if (!metric) return null;
    const isUp = metric.growth >= 0;
    let trendColor = 'neutral';
    let icon = null;
    
    if (metric.growth > 0) {
      trendColor = invertColors ? 'down' : 'up';
      icon = <ArrowUpRight size={14} />;
    } else if (metric.growth < 0) {
      trendColor = invertColors ? 'up' : 'down';
      icon = <ArrowDownRight size={14} />;
    }

    return (
      <Card className={styles.kpiCardWrapper}>
        <CardContent className={styles.kpiCard}>
          <h3 className={styles.kpiTitle}>{title}</h3>
          <div className={styles.kpiValueRow}>
            <h2 className={styles.kpiValue}>
              {isCurrency ? formatCurrency(metric.value) : `${metric.value.toFixed(1)}%`}
            </h2>
            <div className={`${styles.kpiGrowthBadge} ${styles[trendColor]}`}>
              {icon} {Math.abs(metric.growth).toFixed(1)}%
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getHealthStatus = (score) => {
    if (score >= 90) return { label: 'Excellent', class: styles.healthExcellent };
    if (score >= 70) return { label: 'Good', class: styles.healthGood };
    if (score >= 50) return { label: 'Warning', class: styles.healthWarning };
    return { label: 'Poor', class: styles.healthPoor };
  };

  const health = data ? getHealthStatus(data.healthScore) : null;

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Advanced Reports</h1>
          <p className={styles.subtitle}>CFO-level analytics and financial insights.</p>
        </div>
        <div className={styles.actions}>
          <div className={styles.datePicker}>
            <button className={`${styles.datePickerBtn} ${dateRange === 'monthly' ? styles.active : ''}`} onClick={() => setDateRange('monthly')}>1M</button>
            <button className={`${styles.datePickerBtn} ${dateRange === 'quarterly' ? styles.active : ''}`} onClick={() => setDateRange('quarterly')}>3M</button>
            <button className={`${styles.datePickerBtn} ${dateRange === 'yearly' ? styles.active : ''}`} onClick={() => setDateRange('yearly')}>1Y</button>
            <button className={`${styles.datePickerBtn} ${dateRange === 'all' ? styles.active : ''}`} onClick={() => setDateRange('all')}>All</button>
          </div>
          <Button variant="outline" icon={Download} onClick={handleExportExcel} disabled={isLoading || !data}>Export</Button>
        </div>
      </div>

      {isLoading || !data ? (
        <div className={styles.emptyState}>Loading reports...</div>
      ) : data.monthlyData.length === 0 && data.expensesByCategory.length === 0 ? (
        <div className={styles.emptyState}>
          <Activity size={48} style={{ opacity: 0.3 }} />
          <h3>No Financial Data Yet</h3>
          <p>Your reports will generate once you start adding transactions.</p>
        </div>
      ) : (
        <>
          {/* TOP KPIs */}
          <div className={styles.kpiGrid}>
            {renderKPI('Total Revenue', data.kpis.revenue)}
            {renderKPI('Total Expenses', data.kpis.expenses, true, true)}
            {renderKPI('Net Profit', data.kpis.profit)}
            {renderKPI('Profit Margin', data.kpis.profitMargin, false)}
          </div>

          <div className={styles.mainGrid}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Cash Flow Chart */}
              <Card>
                <CardHeader title="Cash Flow & Profit Trend" subtitle="Income vs Expenses over the selected period" />
                <CardContent>
                  <AreaChart 
                    data={data.monthlyData} 
                    xKey="name" 
                    series={[
                      { dataKey: 'Income', name: 'Revenue', color: 'emerald' },
                      { dataKey: 'Expense', name: 'Expenses', color: 'red' },
                      { dataKey: 'Profit', name: 'Net Profit', color: 'indigo' }
                    ]} 
                    height={300} 
                  />
                </CardContent>
              </Card>

              {/* Monthly Summary Table */}
              <Card>
                <CardHeader title="Period Breakdown" subtitle="Detailed monthly performance" />
                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Revenue</th>
                        <th>Expenses</th>
                        <th>Net Profit</th>
                        <th>Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.monthlyData.map((row, i) => {
                        const margin = row.Income > 0 ? ((row.Profit / row.Income) * 100).toFixed(1) : 0;
                        return (
                          <tr key={i}>
                            <td>{row.name}</td>
                            <td className={`${styles.money} ${styles.positive}`}>{formatCurrency(row.Income)}</td>
                            <td className={`${styles.money} ${styles.negative}`}>{formatCurrency(row.Expense)}</td>
                            <td className={`${styles.money} ${row.Profit >= 0 ? styles.positive : styles.negative}`}>
                              {formatCurrency(row.Profit)}
                            </td>
                            <td>{margin}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Financial Metrics & AI Insights */}
              <Card>
                <CardHeader title="Financial Health" icon={<Activity size={18} color="var(--color-indigo)" />} />
                <CardContent>
                  <div className={styles.healthScoreContainer}>
                    <div className={`${styles.healthScoreCircle} ${health.class}`}>
                      {data.healthScore}
                    </div>
                    <div className={styles.healthStatus}>{health.label}</div>
                  </div>

                  <div className={styles.metricsGrid}>
                    <div className={styles.metricBox}>
                      <span className={styles.metricBoxLabel}>Gross Margin</span>
                      <span className={styles.metricBoxValue}>{data.metrics.grossMargin.toFixed(1)}%</span>
                    </div>
                    <div className={styles.metricBox}>
                      <span className={styles.metricBoxLabel}>Op. Margin</span>
                      <span className={styles.metricBoxValue}>{data.metrics.operatingMargin.toFixed(1)}%</span>
                    </div>
                    <div className={styles.metricBox}>
                      <span className={styles.metricBoxLabel}>Expense Ratio</span>
                      <span className={styles.metricBoxValue}>{data.metrics.expenseRatio.toFixed(1)}%</span>
                    </div>
                    <div className={styles.metricBox}>
                      <span className={styles.metricBoxLabel}>Growth</span>
                      <span className={styles.metricBoxValue}>{data.metrics.revenueGrowth.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className={styles.aiInsights}>
                    <h4 style={{ margin: '16px 0 8px 0', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      AI Executive Summary
                    </h4>
                    {data.insights.map((insight) => (
                      <div key={insight.id} className={styles.aiInsightCard}>
                        <Sparkles size={16} className={styles.aiInsightIcon} />
                        <p className={styles.aiInsightText}>{insight.text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Expense Breakdown Chart */}
              <Card>
                <CardHeader title="Expense Distribution" icon={<PieChartIcon size={18} />} />
                <CardContent>
                  <BarChart 
                    data={data.expensesByCategory.slice(0, 6)} 
                    xKey="name" 
                    series={[{ dataKey: 'value', name: 'Amount', color: 'red' }]} 
                    height={250} 
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


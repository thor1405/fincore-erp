import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AreaChart, BarChart, LineChart } from '../components/ui/Charts';
import { 
  ArrowUpRight, ArrowDownRight, ArrowRight, Download, Plus, 
  FileText, CreditCard, Users, FilePlus, Bell, Activity, Sparkles, AlertCircle, FileWarning
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { TransactionModal } from '../components/TransactionModal';
import { InvoiceModal } from '../components/InvoiceModal';
import { CustomerModal } from '../components/CustomerModal';
import { PaymentModal } from '../components/PaymentModal';
import { AgingReportModal } from '../components/AgingReportModal';
import { RoleGuard } from '../components/RoleGuard';
import * as XLSX from 'xlsx';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { token } = useAuth();
  const { formatCurrency } = useSettings();
  const [data, setData] = useState({
    kpis: {
      revenue: { value: 0, growth: 0, sparkline: [] },
      expenses: { value: 0, growth: 0, sparkline: [] },
      profit: { value: 0, growth: 0, sparkline: [] },
      cash: { value: 0, growth: 0, sparkline: [] }
    },
    cashFlowData: [],
    expenseCategories: [],
    recentTransactions: [],
    recentActivity: [],
    ar: { total: 0, overdue: 0, overdueCount: 0, pendingCount: 0 },
    ap: { total: 0, upcomingCount: 0 },
    healthScore: 80,
    insights: []
  });
  const [timeframe, setTimeframe] = useState('monthly');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAgingModalOpen, setIsAgingModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard?timeframe=${timeframe}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token, timeframe]);

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsTx = XLSX.utils.json_to_sheet(data.recentTransactions);
    XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');
    XLSX.writeFile(wb, `Dashboard_${timeframe}.xlsx`);
  };

  const renderKPI = (title, metric, invertColors = false, chartColor = 'emerald') => {
    let badgeColor = 'neutral';
    let icon = null;
    let badgeContent = 'N/A';
    
    if (metric.growth !== null) {
      if (metric.growth > 0) {
        badgeColor = invertColors ? 'down' : 'up';
        icon = <ArrowUpRight size={14} />;
      } else if (metric.growth < 0) {
        badgeColor = invertColors ? 'up' : 'down';
        icon = <ArrowDownRight size={14} />;
      }
      badgeContent = <>{icon} {Math.abs(metric.growth).toFixed(1)}%</>;
    }

    return (
      <Card className={styles.kpiCardWrapper}>
        <CardContent className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <h3 className={styles.kpiTitle}>{title}</h3>
            <div className={`${styles.kpiGrowthBadge} ${styles[badgeColor]}`}>
              {badgeContent}
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <h2 className={styles.kpiValue}>{formatCurrency(metric.value)}</h2>
          </div>
          <div className={styles.kpiSparkline}>
            <LineChart 
              data={metric.sparkline} 
              xKey="index" 
              series={[{ dataKey: 'value', color: chartColor }]} 
              height={40} 
            />
          </div>
          <p className={styles.kpiBottom}>vs previous {timeframe}</p>
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

  const health = getHealthStatus(data.healthScore);

  const getModuleIcon = (module) => {
    switch (module) {
      case 'Transactions': return <CreditCard size={16} />;
      case 'Invoices': return <FileText size={16} />;
      case 'Profile': return <Users size={16} />;
      case 'Settings': return <Activity size={16} />;
      default: return <Bell size={16} />;
    }
  };
  const getModuleColorClass = (module) => {
    switch (module) {
      case 'Transactions': return 'blue';
      case 'Invoices': return 'amber';
      case 'Profile': return 'emerald';
      case 'Settings': return 'indigo';
      case 'Authentication': return 'red';
      default: return 'indigo';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Executive Dashboard</h1>
          <p className={styles.subtitle}>Your premium financial command center</p>
        </div>
        <div className={styles.actions}>
          <select 
            className={styles.timeframeSelect} 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
            <option value="all">All Time</option>
          </select>
          <Button variant="outline" icon={Download} onClick={handleExportExcel}>Export Data</Button>
          <RoleGuard allowedRoles={['Owner', 'Admin', 'Editor']}>
            <Button icon={Plus} onClick={() => setIsTxModalOpen(true)}>New Transaction</Button>
          </RoleGuard>
        </div>
      </div>

      {/* KPI ROW */}
      <div className={styles.kpiGrid}>
        {renderKPI('Total Revenue', data.kpis.revenue, false, 'emerald')}
        {renderKPI('Total Expenses', data.kpis.expenses, true, 'red')}
        {renderKPI('Net Profit', data.kpis.profit, false, 'blue')}
        {renderKPI('Cash Balance', data.kpis.cash, false, 'blue')}
      </div>

      {/* CHARTS ROW (70/30) */}
      <div className={styles.chartsGrid}>
        <Card>
          <CardHeader title="Cash Flow Overview" subtitle="Inflow vs Outflow over time" />
          <CardContent>
            {data.cashFlowData.length === 0 ? (
              <div className={styles.emptyState}>
                <Activity size={48} className={styles.emptyStateIcon} />
                <p>No cash flow data to display.</p>
              </div>
            ) : (
              <AreaChart 
                data={data.cashFlowData} 
                xKey="time" 
                series={[
                  { dataKey: 'in', name: 'Inflow', color: 'emerald' },
                  { dataKey: 'out', name: 'Outflow', color: 'red' },
                  { dataKey: 'profit', name: 'Profit', color: 'blue' }
                ]} 
                height={350} 
                valueFormatter={formatCurrency}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Recent Activity" subtitle="Real-time audit log" />
          <div className={styles.activityList}>
            {data.recentActivity.length === 0 ? (
              <div className={styles.emptyState}>
                <Bell size={32} className={styles.emptyStateIcon} />
                <p>No recent activity.</p>
              </div>
            ) : (
              data.recentActivity.slice(0, 6).map((act) => (
                <div key={act.id} className={styles.activityFeedItem}>
                  <div className={`${styles.activityFeedIcon} ${styles[getModuleColorClass(act.module)]}`}>
                    {getModuleIcon(act.module)}
                  </div>
                  <div className={styles.activityFeedContent}>
                    <p className={styles.activityFeedTitle}>{act.details || act.action}</p>
                    <p className={styles.activityFeedMeta}>
                      {new Date(act.createdAt).toLocaleString()} • {act.module}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* WIDGETS ROW 1 */}
      <div className={styles.widgetsGrid3}>
        <Card>
          <CardHeader title="Expense Categories" subtitle="Where your money goes" />
          <CardContent>
            {data.expenseCategories.length === 0 ? (
              <div className={styles.emptyState}>
                <Activity size={48} className={styles.emptyStateIcon} />
                <p>No expenses logged.</p>
              </div>
            ) : (
              <BarChart 
                data={data.expenseCategories.slice(0, 5)} 
                xKey="name" 
                series={[{ dataKey: 'value', name: 'Amount', color: 'indigo' }]} 
                height={220} 
                valueFormatter={formatCurrency}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Outstanding Invoices" subtitle="Requires attention" />
          <CardContent>
            <div className={styles.summaryBlock}>
              <span className={styles.summaryLabel}>Total Outstanding</span>
              <span className={styles.summaryAmount}>{formatCurrency(data.ar.total)}</span>
              <span className={styles.summarySubtext}>{data.ar.pendingCount} invoices pending</span>
            </div>
            <div className={styles.summaryBlock} style={{ marginTop: '24px' }}>
              <span className={styles.summaryLabel}>Overdue</span>
              <span className={styles.summaryAmount} style={{ color: 'var(--color-red)' }}>{formatCurrency(data.ar.overdue)}</span>
              <span className={styles.summarySubtext}>{data.ar.overdueCount} invoices overdue</span>
            </div>
            <Button variant="outline" fullWidth style={{ marginTop: '24px' }} onClick={() => setIsAgingModalOpen(true)}>View Aging Report</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Financial Health" subtitle="Calculated algorithmic score" />
          <CardContent className={styles.healthScoreContainer}>
            <div className={`${styles.healthScoreCircle} ${health.class}`}>
              {data.healthScore}
            </div>
            <div className={styles.healthStatus}>{health.label}</div>
            <p style={{ margin: 0, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Based on cash flow, overdue invoices, and current profit margins.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* WIDGETS ROW 2 */}
      <div className={styles.widgetsGrid2}>
        <Card>
          <CardHeader title="AI Insights" subtitle="Smart analysis of your finances" icon={<Sparkles size={18} color="var(--color-indigo)" />} />
          <CardContent>
            <div className={styles.insightsList}>
              {data.insights.map((insight) => (
                <div key={insight.id} className={styles.insightCard}>
                  <Sparkles size={16} className={styles.insightIcon} />
                  <p className={styles.insightText}>{insight.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Quick Actions" subtitle="Fast data entry" />
          <CardContent>
            <RoleGuard allowedRoles={['Owner', 'Admin', 'Editor']}>
              <div className={styles.quickActions}>
                <div className={styles.actionBtn} onClick={() => setIsInvoiceModalOpen(true)}>
                  <div className={styles.actionBtnIcon}><FilePlus size={24} /></div>
                  <span className={styles.actionBtnText}>Create Invoice</span>
                </div>
                <div className={styles.actionBtn} onClick={() => setIsTxModalOpen(true)}>
                  <div className={styles.actionBtnIcon}><CreditCard size={24} /></div>
                  <span className={styles.actionBtnText}>Record Expense</span>
                </div>
                <div className={styles.actionBtn} onClick={() => setIsCustomerModalOpen(true)}>
                  <div className={styles.actionBtnIcon}><Users size={24} /></div>
                  <span className={styles.actionBtnText}>Add Customer</span>
                </div>
                <div className={styles.actionBtn} onClick={() => setIsPaymentModalOpen(true)}>
                  <div className={styles.actionBtnIcon}><Activity size={24} /></div>
                  <span className={styles.actionBtnText}>Record Payment</span>
                </div>
              </div>
            </RoleGuard>
            {(!token || !['Owner', 'Admin', 'Editor'].includes(data.role)) && (
               <RoleGuard allowedRoles={['Viewer']}>
                 <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                   Quick actions are restricted for viewers.
                 </div>
               </RoleGuard>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RECENT TRANSACTIONS TABLE */}
      <Card>
        <CardHeader title="Recent Transactions" action={<Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">View All</Button>} />
        <div className={styles.txTableWrapper}>
          {data.recentTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <FileWarning size={48} className={styles.emptyStateIcon} />
              <p>No recent transactions.</p>
            </div>
          ) : (
            <table className={styles.txTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 500 }}>{tx.description}</td>
                    <td>{tx.category}</td>
                    <td>{tx.type}</td>
                    <td className={`${styles.txAmount} ${tx.type === 'Credit' ? styles.credit : ''}`}>
                      {tx.type === 'Credit' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                    </td>
                    <td>
                      <Badge variant={tx.status === 'Completed' ? 'success' : tx.status === 'Pending' ? 'warning' : 'error'}>
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <TransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} onTransactionAdded={fetchDashboardData} />
      <InvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} onInvoiceAdded={fetchDashboardData} />
      <CustomerModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onCustomerAdded={fetchDashboardData} />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onPaymentAdded={fetchDashboardData} />
      <AgingReportModal isOpen={isAgingModalOpen} onClose={() => setIsAgingModalOpen(false)} />
    </div>
  );
}


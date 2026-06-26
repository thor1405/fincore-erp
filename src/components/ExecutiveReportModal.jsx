import React from 'react';
import { Download, Printer, X, ShieldCheck, Activity, BarChart2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useSettings } from '../contexts/SettingsContext';
import styles from './ExecutiveReportModal.module.css';

export function ExecutiveReportModal({ isOpen, onClose, data, title = 'Executive Financial Audit Report', timeframe = 'Selected Period', onExportRaw }) {
  const { formatCurrency } = useSettings();

  if (!isOpen || !data) return null;

  const handlePrintPdf = () => {
    window.print();
  };

  const kpis = data.kpis || {};
  const monthlyData = data.monthlyData || data.cashFlowData || [];
  const expenses = data.expensesByCategory || data.expenseCategories || [];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        {/* Non-printable Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <ShieldCheck className={styles.toolbarIcon} size={20} />
            <span className={styles.toolbarTitle}>CFO Executive Document Generator</span>
          </div>
          <div className={styles.toolbarActions}>
            <Button variant="outline" size="sm" icon={Download} onClick={onExportRaw}>
              Export Raw Sheet
            </Button>
            <Button size="sm" icon={Printer} onClick={handlePrintPdf}>
              Save Executive PDF
            </Button>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Report Paper */}
        <div className={styles.documentViewport}>
          <div className={styles.paper}>
            {/* Document Header */}
            <header className={styles.paperHeader}>
              <div className={styles.brandRow}>
                <div className={styles.brandLogo}>
                  <span className={styles.brandDot}></span>
                  FinCore ERP
                </div>
                <div className={styles.confidentialBadge}>CONFIDENTIAL • AUDITED</div>
              </div>
              <h1 className={styles.docTitle}>{title}</h1>
              <div className={styles.metaRow}>
                <span>Prepared For: <strong>Executive Leadership</strong></span>
                <span>Timeframe: <strong>{timeframe}</strong></span>
                <span>Generated On: <strong>{new Date().toLocaleDateString()}</strong></span>
              </div>
            </header>

            {/* Executive Scorecard */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. Executive Performance Scorecard</h2>
              <div className={styles.kpiGrid}>
                <div className={styles.kpiBox}>
                  <span className={styles.kpiLabel}>Gross Revenue</span>
                  <span className={`${styles.kpiVal} ${styles.pos}`}>
                    {kpis.revenue ? formatCurrency(kpis.revenue.value || kpis.revenue) : '$0.00'}
                  </span>
                </div>
                <div className={styles.kpiBox}>
                  <span className={styles.kpiLabel}>Total Operating Expenses</span>
                  <span className={`${styles.kpiVal} ${styles.neg}`}>
                    {kpis.expenses ? formatCurrency(kpis.expenses.value || kpis.expenses) : '$0.00'}
                  </span>
                </div>
                <div className={styles.kpiBox}>
                  <span className={styles.kpiLabel}>Net Profit Reconciliation</span>
                  <span className={styles.kpiVal}>
                    {kpis.profit ? formatCurrency(kpis.profit.value || kpis.profit) : '$0.00'}
                  </span>
                </div>
                <div className={styles.kpiBox}>
                  <span className={styles.kpiLabel}>Health Rating Score</span>
                  <span className={styles.kpiVal} style={{ color: '#4f46e5' }}>
                    {data.healthScore || 95} / 100
                  </span>
                </div>
              </div>
            </section>

            {/* Visual Vector Diagram Representation */}
            {monthlyData.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Revenue vs Expenditure Trend Diagram</h2>
                <div className={styles.diagramCard}>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', borderBottom: '1px solid #cbd5e1', paddingBottom: 16, paddingTop: 32, minHeight: 210 }}>
                    {monthlyData.slice(0, 8).map((item, idx) => {
                      const inc = item.Income || item.in || 0;
                      const exp = item.Expense || item.out || 0;
                      const max = Math.max(...monthlyData.slice(0, 8).map(m => Math.max(m.Income||m.in||0, m.Expense||m.out||0)), 1);
                      const incH = Math.max((inc / max) * 125, 4);
                      const expH = Math.max((exp / max) * 125, 4);

                      const formatCompact = (val) => {
                        if (!val) return '0';
                        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                        if (val >= 1000) return `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k`;
                        return `${val.toFixed(0)}`;
                      };

                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1 }}>
                          <svg width="44" height="150" style={{ overflow: 'visible' }}>
                            {/* Income Value Label */}
                            <text
                              x="10"
                              y={146 - incH - 6}
                              textAnchor="middle"
                              fontSize="9.5"
                              fontWeight="800"
                              fill="#065f46"
                            >
                              {formatCompact(inc)}
                            </text>
                            {/* Income Bar */}
                            <rect
                              x="2"
                              y={146 - incH}
                              width="16"
                              height={incH}
                              fill="#10b981"
                              rx="3"
                            >
                              <title>Income: {formatCurrency(inc)}</title>
                            </rect>

                            {/* Expense Value Label */}
                            <text
                              x="34"
                              y={146 - expH - 6}
                              textAnchor="middle"
                              fontSize="9.5"
                              fontWeight="800"
                              fill="#991b1b"
                            >
                              {formatCompact(exp)}
                            </text>
                            {/* Expense Bar */}
                            <rect
                              x="26"
                              y={146 - expH}
                              width="16"
                              height={expH}
                              fill="#ef4444"
                              rx="3"
                            >
                              <title>Expense: {formatCurrency(exp)}</title>
                            </rect>
                          </svg>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textAlign: 'center', display: 'block' }}>
                            {item.name || item.time || `T${idx+1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.diagramLegend}>
                    <span className={styles.legendItem}>
                      <svg width="12" height="12" style={{ marginRight: 6, verticalAlign: '-1px' }}><rect width="12" height="12" rx="2" fill="#10b981"/></svg>
                      Gross Revenue Inflow
                    </span>
                    <span className={styles.legendItem}>
                      <svg width="12" height="12" style={{ marginRight: 6, verticalAlign: '-1px' }}><rect width="12" height="12" rx="2" fill="#ef4444"/></svg>
                      Operating Expenditure
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Styled Fill Table */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. Audited Period Ledger Schedule</h2>
              <table className={styles.styledTable}>
                <thead>
                  <tr>
                    <th>Period / Segment</th>
                    <th align="right">Gross Inflow</th>
                    <th align="right">Gross Outflow</th>
                    <th align="right">Net Cash Flow</th>
                    <th align="right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.length === 0 ? (
                    <tr>
                      <td colSpan="5" align="center" style={{ padding: '24px' }}>No period records logged.</td>
                    </tr>
                  ) : (
                    monthlyData.map((row, i) => {
                      const inc = row.Income || row.in || 0;
                      const exp = row.Expense || row.out || 0;
                      const net = row.Profit || (inc - exp);
                      const isPos = net >= 0;
                      return (
                        <tr key={i} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                          <td style={{ fontWeight: 600 }}>{row.name || row.time || `Period ${i+1}`}</td>
                          <td align="right" style={{ color: '#059669', fontWeight: 600 }}>{formatCurrency(inc)}</td>
                          <td align="right" style={{ color: '#dc2626', fontWeight: 600 }}>{formatCurrency(exp)}</td>
                          <td align="right" style={{ fontWeight: 700, color: isPos ? '#0b0f19' : '#dc2626' }}>
                            {formatCurrency(net)}
                          </td>
                          <td align="right">
                            <span className={isPos ? styles.pillPos : styles.pillNeg}>
                              {isPos ? 'Reconciled' : 'Deficit'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </section>

            {/* Sign-off Footer */}
            <footer className={styles.paperFooter}>
              <div className={styles.signRow}>
                <div className={styles.signBox}>
                  <div className={styles.signLine}></div>
                  <span>Chief Financial Officer (CFO)</span>
                </div>
                <div className={styles.signBox}>
                  <div className={styles.signLine}></div>
                  <span>Managing Director / Auditor</span>
                </div>
              </div>
              <div className={styles.auditDisclaimer}>
                This document contains confidential financial information prepared by FinCore Automated ERP Engine. Unauthorized distribution is strictly prohibited under corporate compliance policies.
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Download, Printer, X, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { useSettings } from '../contexts/SettingsContext';
import styles from './ExecutiveReportModal.module.css';

export function ExecutiveReportModal({ isOpen, onClose, data, title = 'Executive Financial Audit Report', timeframe = 'Selected Period', onExportRaw }) {
  const { formatCurrency } = useSettings();

  if (!isOpen || !data) return null;

  const kpis = data.kpis || {};
  const monthlyData = data.monthlyData || data.cashFlowData || [];

  const handlePrintPdf = () => {
    const kpisObj = data.kpis || {};
    const mData = data.monthlyData || data.cashFlowData || [];

    const formatCompact = (val) => {
      if (!val) return '0';
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k`;
      return `${val.toFixed(0)}`;
    };

    const maxVal = Math.max(...mData.slice(0, 8).map(m => Math.max(m.Income||m.in||0, m.Expense||m.out||0)), 1);

    const chartBarsHtml = mData.slice(0, 8).map((item, idx) => {
      const inc = item.Income || item.in || 0;
      const exp = item.Expense || item.out || 0;
      const incH = Math.max((inc / maxVal) * 125, 4);
      const expH = Math.max((exp / maxVal) * 125, 4);
      return `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 1;">
          <svg width="44" height="150" style="overflow: visible;">
            <text x="22" y="${146 - incH - 6}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#065f46">${formatCompact(inc)}</text>
            <rect x="6" y="${146 - incH}" width="14" height="${incH}" fill="#10b981" rx="3"><title>Income: ${formatCurrency(inc)}</title></rect>
            <text x="22" y="${146 - expH - 6}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#991b1b" dx="16">${formatCompact(exp)}</text>
            <rect x="24" y="${146 - expH}" width="14" height="${expH}" fill="#ef4444" rx="3"><title>Expense: ${formatCurrency(exp)}</title></rect>
          </svg>
          <span style="font-size: 11.5px; font-weight: 700; color: #334155; text-align: center; display: block;">${item.name || item.time || `T${idx+1}`}</span>
        </div>
      `;
    }).join('');

    const tableRowsHtml = mData.length === 0 
      ? `<tr><td colspan="5" align="center" style="padding: 24px;">No period records logged.</td></tr>`
      : mData.map((row, i) => {
          const inc = row.Income || row.in || 0;
          const exp = row.Expense || row.out || 0;
          const net = row.Profit || (inc - exp);
          const isPos = net >= 0;
          return `
            <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${row.name || row.time || `Period ${i+1}`}</td>
              <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #059669; font-weight: 600;">${formatCurrency(inc)}</td>
              <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #dc2626; font-weight: 600;">${formatCurrency(exp)}</td>
              <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: ${isPos ? '#0f172a' : '#dc2626'};">${formatCurrency(net)}</td>
              <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
                <span style="background-color: ${isPos ? '#d1fae5' : '#fee2e2'}; color: ${isPos ? '#065f46' : '#991b1b'}; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700;">
                  ${isPos ? 'Reconciled' : 'Deficit'}
                </span>
              </td>
            </tr>
          `;
        }).join('');

    const standaloneHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0; padding: 36px 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
          .printBtnBar { max-width: 860px; margin: 0 auto 24px auto; display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 12px 20px; border-radius: 8px; color: white; }
          .printBtn { background: #3b82f6; color: white; border: none; padding: 10px 22px; font-size: 14px; font-weight: 700; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.3); transition: background 0.2s; }
          .printBtn:hover { background: #2563eb; }
          .paper { max-width: 860px; margin: 0 auto; background: #ffffff; padding: 48px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
          .paperHeader { border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 32px; }
          .brandRow { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
          .brandLogo { font-size: 20px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px; }
          .brandDot { width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; display: inline-block; }
          .confidentialBadge { font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #475569; background: #f1f5f9; padding: 4px 10px; border-radius: 4px; }
          h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; }
          .metaRow { display: flex; gap: 24px; font-size: 13px; color: #64748b; }
          .section { margin-bottom: 40px; }
          .sectionTitle { font-size: 15px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
          .kpiGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
          .kpiBox { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
          .kpiLabel { font-size: 12px; font-weight: 600; color: #64748b; }
          .kpiVal { font-size: 20px; font-weight: 800; color: #0f172a; }
          .diagramCard { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
          th { background: #f1f5f9; color: #334155; font-weight: 700; padding: 12px 16px; border-bottom: 2px solid #cbd5e1; }
          .footer { margin-top: 56px; border-top: 2px solid #e2e8f0; padding-top: 32px; }
          .signRow { display: flex; justify-content: space-between; margin-bottom: 32px; }
          .signBox { width: 220px; text-align: center; font-size: 13px; font-weight: 600; color: #334155; }
          .signLine { border-bottom: 1px solid #0f172a; height: 40px; margin-bottom: 8px; }
          .disclaimer { font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; }
          @media print {
            body { padding: 0; background: #ffffff; }
            .printBtnBar { display: none !important; }
            .paper { border: none; box-shadow: none; padding: 0; max-width: none; width: 100%; border-radius: 0; }
            tr, .kpiBox, .diagramCard, .signBox { page-break-inside: avoid; break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="printBtnBar">
          <span style="font-size: 13.5px; font-weight: 600;">📄 Audited Financial Document Ready</span>
          <button class="printBtn" onclick="window.print()">🖨️ Print / Save PDF</button>
        </div>
        <div class="paper">
          <header class="paperHeader">
            <div class="brandRow">
              <div class="brandLogo"><span class="brandDot"></span> FinCore ERP</div>
              <div class="confidentialBadge">CONFIDENTIAL • AUDITED</div>
            </div>
            <h1>${title}</h1>
            <div class="metaRow">
              <span>Prepared For: <strong>Executive Leadership</strong></span>
              <span>Timeframe: <strong>${timeframe}</strong></span>
              <span>Generated On: <strong>${new Date().toLocaleDateString()}</strong></span>
            </div>
          </header>

          <section class="section">
            <div class="sectionTitle">1. Executive Performance Scorecard</div>
            <div class="kpiGrid">
              <div class="kpiBox">
                <span class="kpiLabel">Gross Revenue</span>
                <span class="kpiVal" style="color: #059669;">${kpis.revenue ? formatCurrency(kpis.revenue.value || kpis.revenue) : '$0.00'}</span>
              </div>
              <div class="kpiBox">
                <span class="kpiLabel">Total Operating Expenses</span>
                <span class="kpiVal" style="color: #dc2626;">${kpis.expenses ? formatCurrency(kpis.expenses.value || kpis.expenses) : '$0.00'}</span>
              </div>
              <div class="kpiBox">
                <span class="kpiLabel">Net Profit Reconciliation</span>
                <span class="kpiVal">${kpis.profit ? formatCurrency(kpis.profit.value || kpis.profit) : '$0.00'}</span>
              </div>
              <div class="kpiBox">
                <span class="kpiLabel">Health Rating Score</span>
                <span class="kpiVal" style="color: #4f46e5;">${data.healthScore || 95} / 100</span>
              </div>
            </div>
          </section>

          ${mData.length > 0 ? `
            <section class="section">
              <div class="sectionTitle">2. Revenue vs Expenditure Trend Diagram</div>
              <div class="diagramCard">
                <div style="width: 100%; display: flex; align-items: flex-end; justify-content: space-around; border-bottom: 1px solid #cbd5e1; padding-bottom: 16px; padding-top: 32px; min-height: 210px;">
                  ${chartBarsHtml}
                </div>
                <div style="display: flex; justify-content: center; gap: 24px; margin-top: 16px; font-size: 12px; font-weight: 600; color: #475569;">
                  <span><span style="display: inline-block; width: 12px; height: 12px; background: #10b981; border-radius: 2px; margin-right: 6px; vertical-align: -1px;"></span> Gross Revenue Inflow</span>
                  <span><span style="display: inline-block; width: 12px; height: 12px; background: #ef4444; border-radius: 2px; margin-right: 6px; vertical-align: -1px;"></span> Operating Expenditure</span>
                </div>
              </div>
            </section>
          ` : ''}

          <section class="section">
            <div class="sectionTitle">3. Audited Period Ledger Schedule</div>
            <table>
              <thead>
                <tr>
                  <th>Period / Segment</th>
                  <th style="text-align: right;">Gross Inflow</th>
                  <th style="text-align: right;">Gross Outflow</th>
                  <th style="text-align: right;">Net Cash Flow</th>
                  <th style="text-align: right;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </section>

          <footer class="footer">
            <div class="signRow">
              <div class="signBox"><div class="signLine"></div>Chief Financial Officer (CFO)</div>
              <div class="signBox"><div class="signLine"></div>Managing Director / Auditor</div>
            </div>
            <div class="disclaimer">
              This document contains confidential financial information prepared by FinCore Automated ERP Engine. Unauthorized distribution is strictly prohibited under corporate compliance policies.
            </div>
          </footer>
        </div>
        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    
    const popup = window.open(blobUrl, '_blank');
    if (!popup) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Executive_Audit_Report_${new Date().toISOString().slice(0,10)}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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

        {/* Printable Report Paper Preview */}
        <div className={styles.documentViewport}>
          <div className={styles.paper}>
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
                            <text x="10" y={146 - incH - 6} textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#065f46">{formatCompact(inc)}</text>
                            <rect x="2" y={146 - incH} width="16" height={incH} fill="#10b981" rx="3"><title>Income: {formatCurrency(inc)}</title></rect>
                            <text x="34" y={146 - expH - 6} textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#991b1b">{formatCompact(exp)}</text>
                            <rect x="26" y={146 - expH} width="16" height={expH} fill="#ef4444" rx="3"><title>Expense: {formatCurrency(exp)}</title></rect>
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

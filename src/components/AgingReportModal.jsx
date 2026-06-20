import React, { useState, useEffect } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import * as XLSX from 'xlsx';
import styles from './AgingReportModal.module.css';

export function AgingReportModal({ isOpen, onClose }) {
  const { token } = useAuth();
  const { formatCurrency } = useSettings();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && token) {
      fetchInvoices();
    }
  }, [isOpen, token]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out Paid invoices
        setInvoices(data.filter(inv => inv.status !== 'Paid'));
      }
    } catch (err) {
      console.error('Failed to fetch invoices', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Process Aging Buckets
  const now = new Date();
  const buckets = {
    current: { amount: 0, count: 0, items: [] },
    days30: { amount: 0, count: 0, items: [] },
    days60: { amount: 0, count: 0, items: [] },
    days90: { amount: 0, count: 0, items: [] },
    days90plus: { amount: 0, count: 0, items: [] },
    total: 0
  };

  invoices.forEach(inv => {
    const due = new Date(inv.dueDate);
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    buckets.total += inv.amount;

    if (diffDays <= 0 && inv.status !== 'Overdue') {
      buckets.current.amount += inv.amount;
      buckets.current.count++;
      buckets.current.items.push(inv);
    } else if (diffDays <= 30) {
      buckets.days30.amount += inv.amount;
      buckets.days30.count++;
      buckets.days30.items.push(inv);
    } else if (diffDays <= 60) {
      buckets.days60.amount += inv.amount;
      buckets.days60.count++;
      buckets.days60.items.push(inv);
    } else if (diffDays <= 90) {
      buckets.days90.amount += inv.amount;
      buckets.days90.count++;
      buckets.days90.items.push(inv);
    } else {
      buckets.days90plus.amount += inv.amount;
      buckets.days90plus.count++;
      buckets.days90plus.items.push(inv);
    }
  });

  // Sort items in each bucket by amount descending
  Object.keys(buckets).forEach(key => {
    if (key !== 'total') {
      buckets[key].items.sort((a, b) => b.amount - a.amount);
    }
  });

  const handleExportExcel = () => {
    const formattedData = invoices.map(inv => {
      const due = new Date(inv.dueDate);
      const diffDays = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      let bucketStr = 'Current';
      if (diffDays > 90) bucketStr = '90+ Days';
      else if (diffDays > 60) bucketStr = '61-90 Days';
      else if (diffDays > 30) bucketStr = '31-60 Days';
      else if (diffDays > 0 || inv.status === 'Overdue') bucketStr = '1-30 Days';

      return {
        'Invoice ID': inv.invoiceId,
        'Client': inv.client,
        'Due Date': new Date(inv.dueDate).toLocaleDateString(),
        'Days Past Due': diffDays > 0 ? diffDays : 0,
        'Aging Bucket': bucketStr,
        'Amount': formatCurrency(inv.amount)
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedData);
    XLSX.utils.book_append_sheet(wb, ws, 'Aging Report');
    XLSX.writeFile(wb, 'AR_Aging_Report.xlsx');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Accounts Receivable Aging</h2>
            <p className={styles.subtitle}>Outstanding invoices categorized by time past due.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button variant="outline" size="sm" icon={Download} onClick={handleExportExcel} disabled={isLoading || invoices.length === 0}>
              Export
            </Button>
            <button className={styles.closeButton} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading aging data...</div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-md)' }}>
              <AlertCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>No outstanding invoices found. All clear!</p>
            </div>
          ) : (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.bucketCard}>
                  <p className={styles.bucketTitle}>Current</p>
                  <p className={styles.bucketAmount}>{formatCurrency(buckets.current.amount)}</p>
                </div>
                <div className={styles.bucketCard}>
                  <p className={styles.bucketTitle}>1 - 30 Days</p>
                  <p className={styles.bucketAmount}>{formatCurrency(buckets.days30.amount)}</p>
                </div>
                <div className={`${styles.bucketCard} ${styles.warning}`}>
                  <p className={styles.bucketTitle}>31 - 60 Days</p>
                  <p className={styles.bucketAmount}>{formatCurrency(buckets.days60.amount)}</p>
                </div>
                <div className={`${styles.bucketCard} ${styles.danger}`}>
                  <p className={styles.bucketTitle}>61 - 90 Days</p>
                  <p className={styles.bucketAmount}>{formatCurrency(buckets.days90.amount)}</p>
                </div>
                <div className={`${styles.bucketCard} ${styles.danger}`}>
                  <p className={styles.bucketTitle}>90+ Days</p>
                  <p className={styles.bucketAmount}>{formatCurrency(buckets.days90plus.amount)}</p>
                </div>
              </div>

              <div className={styles.invoicesList}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Client</th>
                      <th>Due Date</th>
                      <th>Bucket</th>
                      <th className={styles.money}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...buckets.days90plus.items.map(i => ({...i, bucket: '90+ Days'})),
                      ...buckets.days90.items.map(i => ({...i, bucket: '61 - 90 Days'})),
                      ...buckets.days60.items.map(i => ({...i, bucket: '31 - 60 Days'})),
                      ...buckets.days30.items.map(i => ({...i, bucket: '1 - 30 Days'})),
                      ...buckets.current.items.map(i => ({...i, bucket: 'Current'}))
                    ].map(inv => (
                      <tr key={inv.id}>
                        <td>{inv.invoiceId}</td>
                        <td>{inv.client}</td>
                        <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td>
                          <span style={{ 
                            color: inv.bucket === 'Current' ? 'inherit' : 
                                   inv.bucket.includes('30') ? 'var(--color-amber)' : 'var(--color-red)'
                          }}>
                            {inv.bucket}
                          </span>
                        </td>
                        <td className={styles.money}>{formatCurrency(inv.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


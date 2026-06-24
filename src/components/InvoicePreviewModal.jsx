import React, { useEffect, useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import styles from './InvoicePreviewModal.module.css';

export function InvoicePreviewModal({ invoice, onClose }) {
  const { token } = useAuth();
  const { formatCurrency } = useSettings();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (invoice && token) {
      // Fetch company settings to populate the invoice header
      fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Failed to fetch settings', err));
    }
  }, [invoice, token]);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className={styles.overlay}>
      <div className={styles.modalContainer}>
        {/* Actions Header - Hidden during print */}
        <div className={`${styles.actionHeader} no-print`}>
          <div className={styles.headerLeft}>
            <h2>Invoice Preview</h2>
            <span className={styles.badge}>{invoice.status}</span>
          </div>
          <div className={styles.headerRight}>
            <Button variant="outline" icon={Printer} onClick={handlePrint}>Print / Save PDF</Button>
            <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
          </div>
        </div>

        {/* The Actual Invoice Document */}
        <div className={styles.documentWrapper}>
          <div className={styles.a4Document}>
            
            <div className={styles.docHeader}>
              <div className={styles.companyInfo}>
                <h1 className={styles.companyName}>{settings?.companyName || 'My Company'}</h1>
                {settings?.address && <p>{settings.address}</p>}
                {(settings?.city || settings?.state) && <p>{settings.city}, {settings.state}</p>}
                {settings?.email && <p>{settings.email}</p>}
                {settings?.phone && <p>{settings.phone}</p>}
                {settings?.taxId && <p>Tax ID: {settings.taxId}</p>}
              </div>
              <div className={styles.invoiceTitleBlock}>
                <h1 className={styles.invoiceTitleText}>INVOICE</h1>
                <p className={styles.invoiceNumber}>#{invoice.invoiceId}</p>
              </div>
            </div>

            <div className={styles.docMeta}>
              <div className={styles.billTo}>
                <h3 className={styles.metaLabel}>BILL TO</h3>
                <p className={styles.clientName}>{invoice.client}</p>
              </div>
              <div className={styles.dates}>
                <div className={styles.dateItem}>
                  <span className={styles.metaLabel}>Date Issued:</span>
                  <span className={styles.dateValue}>{formattedDate}</span>
                </div>
                <div className={styles.dateItem}>
                  <span className={styles.metaLabel}>Due Date:</span>
                  <span className={styles.dateValue}>{formattedDueDate}</span>
                </div>
              </div>
            </div>

            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th className={styles.colDesc}>Description</th>
                  <th className={styles.colQty}>Qty</th>
                  <th className={styles.colPrice}>Unit Price</th>
                  <th className={styles.colTotal}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.colDesc}>
                    <p className={styles.itemTitle}>Services Rendered</p>
                    <p className={styles.itemSubtitle}>Professional services provided for {invoice.client}</p>
                  </td>
                  <td className={styles.colQty}>1</td>
                  <td className={styles.colPrice}>{formatCurrency(invoice.amount)}</td>
                  <td className={styles.colTotal}>{formatCurrency(invoice.amount)}</td>
                </tr>
              </tbody>
            </table>

            <div className={styles.totalsBlock}>
              <div className={styles.totalsRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.amount)}</span>
              </div>
              <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
                <span>Total Due</span>
                <span>{formatCurrency(invoice.amount)}</span>
              </div>
            </div>

            <div className={styles.footer}>
              <p>Thank you for your business!</p>
              <p className={styles.footerFineprint}>Payment is due within the specified timeframe. Please include the invoice number on your check or transfer.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

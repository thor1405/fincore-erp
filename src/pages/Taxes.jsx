import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Sparkles, Send, Bot, User, Loader, Calculator, DollarSign, ArrowRight, Percent, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import styles from './Reports.module.css'; // Reuse existing styles for consistency

export function Taxes() {
  const { token } = useAuth();
  const { formatCurrency } = useSettings();
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Payment form state
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rate form state
  const [rate, setRate] = useState('20');
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);

  const fetchTaxData = async () => {
    try {
      const response = await fetch('/api/tax/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTaxData(data);
        setRate(data.taxRate.toString());
      }
    } catch (err) {
      console.error('Failed to fetch tax data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxData();
  }, [token]);

  const handleUpdateRate = async () => {
    setIsUpdatingRate(true);
    try {
      await fetch('/api/tax/rate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estimatedTaxRate: rate })
      });
      fetchTaxData();
    } catch (err) {
      console.error('Failed to update rate:', err);
    } finally {
      setIsUpdatingRate(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/tax/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, date, description, type: 'Estimated Tax' })
      });
      setAmount('');
      setDescription('');
      fetchTaxData();
    } catch (err) {
      console.error('Failed to record payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading tax data...</div>;
  }

  const dynamicLiability = taxData?.netProfit > 0 ? (taxData.netProfit * (parseFloat(rate || 0) / 100)) : 0;
  const dynamicRemaining = dynamicLiability - (taxData?.totalTaxPaid || 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Tax Management</h1>
          <p className={styles.subtitle}>Track your estimated tax liability and record payments.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <Card>
          <CardHeader title="Estimated Tax Liability" icon={<Calculator size={20} color="var(--color-indigo)" />} />
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Income</span>
                <span style={{ fontWeight: 500, color: 'var(--color-emerald)' }}>{formatCurrency(taxData?.totalIncome)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Expenses</span>
                <span style={{ fontWeight: 500, color: 'var(--color-red)' }}>{formatCurrency(taxData?.totalExpense)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Net Profit</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(taxData?.netProfit)}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <Input 
                  label="Estimated Tax Rate (%)" 
                  type="number" 
                  value={rate} 
                  onChange={(e) => setRate(e.target.value)} 
                  containerClassName={styles.fullSpan} 
                  style={{ marginBottom: 0, width: '100px' }} 
                />
                <Button variant="outline" onClick={handleUpdateRate} disabled={isUpdatingRate} style={{ marginTop: '24px' }}>
                  {isUpdatingRate ? 'Saving...' : 'Update Rate'}
                </Button>
              </div>

              <div style={{ padding: '16px', backgroundColor: 'var(--bg-element)', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Calculated Tax Liability</p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(dynamicLiability)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Tax Payments Summary" icon={<DollarSign size={20} color="var(--color-emerald)" />} />
          <CardContent>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div style={{ padding: '16px', backgroundColor: '#dcfce7', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <p style={{ margin: '0 0 8px', color: '#166534', fontSize: '0.875rem', fontWeight: 500 }}>Total Taxes Paid</p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#15803d' }}>{formatCurrency(taxData?.totalTaxPaid)}</p>
              </div>

              <div style={{ padding: '16px', backgroundColor: dynamicRemaining > 0 ? '#fee2e2' : '#f3f4f6', borderRadius: '8px', border: dynamicRemaining > 0 ? '1px solid #fecaca' : '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 8px', color: dynamicRemaining > 0 ? '#991b1b' : 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Remaining Estimated Tax Due</p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: dynamicRemaining > 0 ? '#b91c1c' : 'var(--text-primary)' }}>{formatCurrency(dynamicRemaining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <Card>
          <CardHeader title="Record Tax Payment" />
          <CardContent>
            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input 
                label="Amount Paid" 
                type="number" 
                step="0.01" 
                required 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
              />
              <Input 
                label="Date Paid" 
                type="date" 
                required 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
              <Input 
                label="Description / Period" 
                placeholder="e.g. Q1 Estimated Tax" 
                required 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
              <Button type="submit" disabled={isSubmitting} style={{ marginTop: '8px' }}>
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Payment History" icon={<FileText size={20} color="var(--text-secondary)" />} />
          <CardContent>
            {taxData?.payments?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                No tax payments recorded yet.
              </div>
            ) : (
              <div className={styles.tableContainer} style={{ overflowY: 'auto', maxHeight: '300px' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxData?.payments?.map((payment) => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.date).toLocaleDateString()}</td>
                        <td>{payment.description}</td>
                        <td style={{ fontWeight: 500, color: 'var(--color-emerald)' }}>{formatCurrency(payment.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


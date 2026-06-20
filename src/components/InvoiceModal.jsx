import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import styles from './InvoiceModal.module.css';

export function InvoiceModal({ isOpen, onClose, onInvoiceAdded, initialData = null }) {
  const { token } = useAuth();
  const [client, setClient] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setClient(initialData.client || '');
      setAmount(initialData.amount || '');
      setDate(initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setDueDate(initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '');
      setStatus(initialData.status || 'Draft');
    } else {
      setClient('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setStatus('Draft');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const isEdit = !!initialData;
      const url = isEdit ? `/api/invoices/${initialData.id}` : '/api/invoices';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ client, amount, date, dueDate, status })
      });

      if (response.ok) {
        setClient('');
        setAmount('');
        onInvoiceAdded();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>{initialData ? 'Edit Invoice' : 'Create Invoice'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input 
            label="Client Name" 
            value={client} 
            onChange={(e) => setClient(e.target.value)} 
            required 
          />
          <Input 
            label="Amount ($)" 
            type="number" 
            step="0.01" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required 
          />
          <Input 
            label="Invoice Date" 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            required 
          />
          <Input 
            label="Due Date" 
            type="date" 
            value={dueDate} 
            onChange={(e) => setDueDate(e.target.value)} 
            required 
          />

          {initialData && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          )}

          <div className={styles.actions}>
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" disabled={isLoading}>{initialData ? 'Save Changes' : 'Create'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}


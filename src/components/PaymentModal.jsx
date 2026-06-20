import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import styles from './PaymentModal.module.css';

export function PaymentModal({ isOpen, onClose, onPaymentAdded, initialData = null }) {
  const { token } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [status, setStatus] = useState('Completed');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setDate(initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setAmount(initialData.amount || '');
      setRecipient(initialData.recipient || '');
      setMethod(initialData.method || 'Bank Transfer');
      setStatus(initialData.status || 'Completed');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setRecipient('');
      setMethod('Bank Transfer');
      setStatus('Completed');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const isEdit = !!initialData;
      const url = isEdit ? `/api/payments/${initialData.id}` : '/api/payments';
      const reqMethod = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: reqMethod,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date, amount, recipient, method, status })
      });

      if (response.ok) {
        setAmount('');
        setRecipient('');
        setMethod('Bank Transfer');
        onPaymentAdded();
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
        <h2>{initialData ? 'Edit Payment' : 'Record Payment'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input 
            label="Date" 
            type="date"
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
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
            label="Recipient / Vendor" 
            value={recipient} 
            onChange={(e) => setRecipient(e.target.value)} 
            required
          />

          <div className={styles.formGroup}>
            <label className={styles.label}>Payment Method</label>
            <select className={styles.select} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Cash">Cash</option>
              <option value="Check">Check</option>
            </select>
          </div>

          {initialData && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          )}

          <div className={styles.actions}>
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" disabled={isLoading}>{initialData ? 'Save Changes' : 'Record'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}


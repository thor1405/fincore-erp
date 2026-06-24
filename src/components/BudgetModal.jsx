import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import styles from './InvoiceModal.module.css'; // Reusing the excellent modal styling

export function BudgetModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const { token } = useAuth();
  const [category, setCategory] = useState(initialData?.category || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCategory(initialData?.category || '');
      setAmount(initialData?.amount || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category, amount })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to save budget', error);
      alert('Failed to save budget');
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>{initialData ? 'Edit Budget Limit' : 'Set Budget Limit'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Expense Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              <option value="" disabled>Select Category</option>
              <option value="Payroll Expense">Payroll Expense</option>
              <option value="Office Expense">Office Expense</option>
              <option value="Software Expense">Software Expense</option>
              <option value="Marketing">Marketing</option>
              <option value="Travel">Travel</option>
              <option value="Legal & Professional">Legal & Professional</option>
              <option value="Cost of Goods Sold">Cost of Goods Sold</option>
              <option value="Other Expenses">Other Expenses</option>
            </select>
          </div>

          <Input 
            label="Monthly Limit ($)" 
            type="number" 
            step="0.01" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required 
            placeholder="e.g. 500"
          />

          <div className={styles.actions}>
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" disabled={isLoading}>{initialData ? 'Save Changes' : 'Set Limit'}</Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

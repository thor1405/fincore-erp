import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import styles from './TransactionModal.module.css';

export function TransactionModal({ isOpen, onClose, onTransactionAdded, initialData = null }) {
  const { token } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Credit');
  const [category, setCategory] = useState('Sales');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDescription(initialData.description);
        setAmount(Math.abs(initialData.amount).toString());
        setType(initialData.type);
        setCategory(initialData.category || 'Sales');
      } else {
        setDescription('');
        setAmount('');
        setType('Credit');
        setCategory('Sales');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = initialData 
        ? `/api/transactions/${initialData.id}`
        : '/api/transactions';
      
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ description, amount, type, category })
      });

      if (response.ok) {
        onTransactionAdded();
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
        <h2>{initialData ? 'Edit Transaction' : 'Add Transaction'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input 
            label="Description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
          />
          <Input 
            label="Amount" 
            type="number" 
            step="0.01" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required 
          />
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Type</label>
            <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Credit">Income (Credit)</option>
              <option value="Debit">Expense (Debit)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Category</label>
            <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Sales">Sales</option>
              <option value="Services">Services</option>
              <option value="Software">Software</option>
              <option value="Payroll">Payroll</option>
              <option value="Office">Office</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={styles.actions}>
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" disabled={isLoading}>{initialData ? 'Save Changes' : 'Add'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}


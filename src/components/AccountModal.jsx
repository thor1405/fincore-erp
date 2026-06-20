import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import styles from './AccountModal.module.css';

export function AccountModal({ isOpen, onClose, onAccountAdded }) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState('Asset');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, type })
      });

      if (response.ok) {
        setName('');
        setType('Asset');
        onAccountAdded();
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
        <h2>Add Account</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input 
            label="Account Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            placeholder="e.g. Petty Cash"
          />
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Account Type</label>
            <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>
          </div>

          <div className={styles.actions}>
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" disabled={isLoading}>Add Account</Button>
          </div>
        </form>
      </div>
    </div>
  );
}


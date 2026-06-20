import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import styles from './CustomerModal.module.css';

export function CustomerModal({ isOpen, onClose, onCustomerAdded, initialData = null }) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setEmail(initialData.email || '');
        setPhone(initialData.phone || '');
      } else {
        setName('');
        setEmail('');
        setPhone('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = initialData 
        ? `/api/customers/${initialData.id}`
        : '/api/customers';
      
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, phone })
      });

      if (response.ok) {
        onCustomerAdded();
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
        <h2>{initialData ? 'Edit Customer' : 'Add Customer'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input 
            label="Customer Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          <Input 
            label="Email" 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <Input 
            label="Phone" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
          />

          <div className={styles.actions}>
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" disabled={isLoading}>{initialData ? 'Save Changes' : 'Add'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}


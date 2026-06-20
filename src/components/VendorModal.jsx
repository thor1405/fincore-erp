import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import styles from './VendorModal.module.css';

export function VendorModal({ isOpen, onClose, onVendorAdded, initialData = null }) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [contact, setContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCategory(initialData.category || '');
      setContact(initialData.contact || '');
    } else {
      setName('');
      setCategory('');
      setContact('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const isEdit = !!initialData;
      const url = isEdit ? `/api/vendors/${initialData.id}` : '/api/vendors';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, category, contact })
      });

      if (response.ok) {
        setName('');
        setCategory('');
        setContact('');
        onVendorAdded();
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
        <h2>{initialData ? 'Edit Vendor' : 'Add Vendor'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input 
            label="Vendor Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          <Input 
            label="Category" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            placeholder="e.g. Software, Office Supplies"
          />
          <Input 
            label="Contact Info" 
            value={contact} 
            onChange={(e) => setContact(e.target.value)} 
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


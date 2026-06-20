import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import styles from './EmployeeModal.module.css';

export function EmployeeModal({ isOpen, onClose, onEmployeeAdded, initialData = null }) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [salary, setSalary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setRole(initialData.role || '');
      setDepartment(initialData.department || '');
      setSalary(initialData.salary || '');
    } else {
      setName('');
      setRole('');
      setDepartment('');
      setSalary('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const isEdit = !!initialData;
      const url = isEdit ? `/api/employees/${initialData.id}` : '/api/employees';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, role, department, salary })
      });

      if (response.ok) {
        setName('');
        setRole('');
        setDepartment('');
        setSalary('');
        onEmployeeAdded();
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
        <h2>{initialData ? 'Edit Employee' : 'Add Employee'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input 
            label="Full Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          <Input 
            label="Role / Title" 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
            required 
          />
          <Input 
            label="Department" 
            value={department} 
            onChange={(e) => setDepartment(e.target.value)} 
            required 
          />
          <Input 
            label="Annual Salary ($)" 
            type="number" 
            value={salary} 
            onChange={(e) => setSalary(e.target.value)} 
            required 
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


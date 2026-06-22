import React, { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { PaymentModal } from '../components/PaymentModal';
import { RoleGuard } from '../components/RoleGuard';
import styles from './Payments.module.css';

export function Payments() {
  const { token, user } = useAuth();
  const canEdit = ['Owner', 'Admin', 'Editor'].includes(user?.role);
  const { formatCurrency } = useSettings();
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPayments(data.map(p => ({
          ...p,
          date: new Date(p.date).toLocaleDateString()
        })));
      }
    } catch (err) {
      console.error('Failed to fetch payments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPayments();
  }, [token]);

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchPayments();
    } catch (err) {
      console.error('Failed to delete payment', err);
    }
  };

  const columns = [
    { header: 'Date', key: 'date', sortable: true },
    { header: 'Recipient', key: 'recipient', sortable: true },
    { header: 'Method', key: 'method', sortable: true },
    { 
      header: 'Amount', 
      key: 'amount', 
      sortable: true,
      align: 'right',
      render: (val) => <span className="tabular-nums">{formatCurrency(val)}</span>
    },
    { 
      header: 'Status', 
      key: 'status', 
      sortable: true,
      render: (val) => <Badge variant={val === 'Completed' ? 'success' : 'default'}>{val}</Badge>
    },
    ...(canEdit ? [{
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => handleEdit(row)} title="Edit"><Edit2 size={16} /></button>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-red)' }} onClick={() => handleDelete(row.id)} title="Delete"><Trash2 size={16} /></button>
        </div>
      )
    }] : [])
  ];

  const filteredData = payments.filter(p => 
    p.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Payments</h1>
          <p className={styles.subtitle}>Track outgoing money and vendor settlements.</p>
        </div>
        <div className={styles.actions}>
          <RoleGuard allowedRoles={['Owner', 'Admin', 'Editor']}>
            <Button icon={Plus} onClick={() => { setEditingPayment(null); setIsModalOpen(true); }}>Record Payment</Button>
          </RoleGuard>
        </div>
      </div>

      <div className={styles.filters}>
        <Input 
          icon={Search} 
          placeholder="Search payments..." 
          containerClassName={styles.searchContainer} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="secondary" icon={Filter}>Status: All</Button>
      </div>

      {isLoading ? (
        <div>Loading payments...</div>
      ) : payments.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
          <p>No payments found. Click "Record Payment" to get started.</p>
        </div>
      ) : (
        <Table 
          columns={columns} 
          data={filteredData} 
          itemsPerPage={10} 
        />
      )}

      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingPayment(null); }} 
        onPaymentAdded={fetchPayments} 
        initialData={editingPayment}
      />
    </div>
  );
}


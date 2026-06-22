import React, { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { AccountModal } from '../components/AccountModal';
import { RoleGuard } from '../components/RoleGuard';
import styles from './Accounts.module.css';

export function Accounts() {
  const { token, user } = useAuth();
  const { formatCurrency } = useSettings();
  const canEdit = ['Owner', 'Admin', 'Editor'].includes(user?.role);
  const [accounts, setAccounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setAccounts(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAccounts();
    } catch (err) {
      console.error('Failed to delete account', err);
    }
  };

  useEffect(() => {
    if (token) fetchAccounts();
  }, [token]);

  const columns = [
    { header: 'Account Name', key: 'name', sortable: true },
    { 
      header: 'Type', 
      key: 'type', 
      sortable: true,
      render: (val) => {
        let variant = 'default';
        if (val === 'Asset') variant = 'success';
        if (val === 'Liability') variant = 'error';
        if (val === 'Equity') variant = 'warning';
        if (val === 'Revenue') variant = 'info';
        if (val === 'Expense') variant = 'error';
        return <Badge variant={variant}>{val}</Badge>;
      }
    },
    {
      header: 'Balance',
      key: 'balance',
      align: 'right',
      render: (val) => (
        <span className="tabular-nums font-medium">{formatCurrency(val)}</span>
      )
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

  const filteredData = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Chart of Accounts</h1>
          <p className={styles.subtitle}>Manage your accounting ledger accounts.</p>
        </div>
        <div className={styles.actions}>
          <RoleGuard allowedRoles={['Owner', 'Admin', 'Editor']}>
            <Button icon={Plus} onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}>Add Account</Button>
          </RoleGuard>
        </div>
      </div>

      <div className={styles.filters}>
        <Input 
          icon={Search} 
          placeholder="Search accounts..." 
          containerClassName={styles.searchContainer} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="secondary" icon={Filter}>Type: All</Button>
      </div>

      {isLoading ? (
        <div>Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
          <p>No accounts found. Click "Add Account" to get started.</p>
        </div>
      ) : (
        <Table 
          columns={columns} 
          data={filteredData} 
          itemsPerPage={15} 
        />
      )}

      <AccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAccountAdded={fetchAccounts} 
      />
    </div>
  );
}


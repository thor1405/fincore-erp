import React, { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Search, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AccountModal } from '../components/AccountModal';
import styles from './Accounts.module.css';

export function Accounts() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    }
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
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>Add Account</Button>
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


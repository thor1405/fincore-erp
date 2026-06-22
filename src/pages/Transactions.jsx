import React, { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Download, Filter, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { TransactionModal } from '../components/TransactionModal';
import { RoleGuard } from '../components/RoleGuard';
import * as XLSX from 'xlsx';
import styles from './Transactions.module.css';

export function Transactions() {
  const { token, user } = useAuth();
  const canEdit = ['Owner', 'Admin', 'Editor'].includes(user?.role);
  const { formatCurrency } = useSettings();
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const formatted = data.map(t => ({
          ...t,
          date: new Date(t.date).toISOString().split('T')[0]
        }));
        setTransactions(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTransactions();
  }, [token]);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          fetchTransactions();
        }
      } catch (err) {
        console.error('Failed to delete transaction', err);
      }
    }
  };

  const openNewModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Date', key: 'date', sortable: true },
    { header: 'Description', key: 'description', sortable: true },
    { header: 'Category', key: 'category', sortable: true },
    { 
      header: 'Amount', 
      key: 'amount', 
      sortable: true,
      align: 'right',
      render: (val, row) => {
        const isCredit = row.type === 'Credit';
        return (
          <span className={`tabular-nums ${isCredit ? styles.positive : styles.negative}`}>
            {isCredit ? '+' : '-'}{formatCurrency(Math.abs(val))}
          </span>
        )
      }
    },
    { 
      header: 'Status', 
      key: 'status', 
      sortable: true,
      render: (val) => (
        <Badge variant={val === 'Completed' ? 'success' : val === 'Pending' ? 'warning' : 'error'}>
          {val}
        </Badge>
      )
    },
    ...(canEdit ? [{
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            onClick={() => handleEdit(row)}
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-red)' }}
            onClick={() => handleDelete(row.id)}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }] : [])
  ];

  const handleExportExcel = () => {
    const formattedData = transactions.map(t => ({
      Date: t.date,
      Description: t.description,
      Category: t.category,
      Type: t.type,
      Amount: formatCurrency(Math.abs(t.amount)),
      Status: t.status
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedData);
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'Transactions.xlsx');
  };

  const filteredData = transactions.filter(t => 
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Transactions</h1>
          <p className={styles.subtitle}>Manage and view all your financial transactions.</p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" icon={Download} onClick={handleExportExcel} disabled={isLoading || transactions.length === 0}>Export to Excel</Button>
          <RoleGuard allowedRoles={['Owner', 'Admin', 'Editor']}>
            <Button icon={Plus} onClick={openNewModal}>Add Transaction</Button>
          </RoleGuard>
        </div>
      </div>

      <div className={styles.filters}>
        <Input 
          icon={Search} 
          placeholder="Search transactions..." 
          containerClassName={styles.searchContainer} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="secondary" icon={Filter}>Filters</Button>
      </div>

      {isLoading ? (
        <div>Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
          <p>No transactions found. Click "Add Transaction" to get started.</p>
        </div>
      ) : (
        <Table 
          columns={columns} 
          data={filteredData} 
          itemsPerPage={10} 
        />
      )}

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onTransactionAdded={fetchTransactions} 
        initialData={editingTransaction}
      />
    </div>
  );
}


import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Plus, Trash2, CheckCircle2, AlertCircle, Save, ArrowLeft, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './JournalEntries.module.css';

export function JournalEntries() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [journalHistory, setJournalHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [entries, setEntries] = useState([
    { id: 1, accountId: '', debit: 0, credit: 0, description: '' },
    { id: 2, accountId: '', debit: 0, credit: 0, description: '' },
  ]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState(`JE-${Math.floor(Math.random() * 90000)}`);
  const [memo, setMemo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setEntries([
      { id: 1, accountId: '', debit: 0, credit: 0, description: '' },
      { id: 2, accountId: '', debit: 0, credit: 0, description: '' },
    ]);
    setDate(new Date().toISOString().split('T')[0]);
    setReference(`JE-${Math.floor(Math.random() * 90000)}`);
    setMemo('');
    setEditingId(null);
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setAccounts(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    }
  };

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/journal', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setJournalHistory(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch journal history', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAccounts();
      fetchHistory();
    }
  }, [token]);

  const handleEdit = (journal) => {
    setDate(new Date(journal.date).toISOString().split('T')[0]);
    setReference(journal.referenceNo);
    setMemo(journal.memo);
    setEntries(journal.lines.map(line => ({
      id: line.id,
      accountId: line.accountId,
      debit: line.debit,
      credit: line.credit,
      description: line.description || ''
    })));
    setEditingId(journal.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchHistory();
    } catch (err) {
      console.error('Failed to delete journal entry', err);
    }
  };

  // Form handlers
  const addEntry = () => {
    setEntries([...entries, { id: Date.now(), accountId: '', debit: 0, credit: 0, description: '' }]);
  };

  const removeEntry = (id) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id, field, value) => {
    setEntries(entries.map(e => {
      if (e.id === id) {
        const updated = { ...e, [field]: value };
        if (field === 'debit' && Number(value) > 0) updated.credit = 0;
        if (field === 'credit' && Number(value) > 0) updated.debit = 0;
        return updated;
      }
      return e;
    }));
  };

  const { totalDebit, totalCredit, isBalanced } = useMemo(() => {
    const debit = entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
    const credit = entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
    return {
      totalDebit: debit,
      totalCredit: credit,
      isBalanced: Math.abs(debit - credit) < 0.01 && debit > 0
    };
  }, [entries]);

  const handlePostEntry = async () => {
    if (!isBalanced) return;
    setIsSaving(true);
    try {
      const url = editingId ? `/api/journal/${editingId}` : '/api/journal';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date,
          referenceNo: reference,
          memo,
          lines: entries.filter(e => e.accountId && (e.debit > 0 || e.credit > 0))
        })
      });

      if (response.ok) {
        resetForm();
        fetchHistory();
        setShowForm(false);
      } else {
        alert('Failed to post entry.');
      }
    } catch (err) {
      console.error(err);
      alert('Error posting entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    { 
      header: 'Date', 
      key: 'date', 
      sortable: true,
      render: (val) => new Date(val).toLocaleDateString()
    },
    { header: 'Reference', key: 'referenceNo', sortable: true },
    { header: 'Memo', key: 'memo', sortable: true },
    { 
      header: 'Total Amount', 
      key: 'lines',
      align: 'right',
      render: (lines) => {
        const amount = lines.reduce((sum, line) => sum + line.debit, 0);
        return <span className="tabular-nums">${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, journal) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" size="sm" icon={Edit2} onClick={() => handleEdit(journal)} />
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(journal.id)} style={{ color: 'var(--color-red)' }} />
        </div>
      )
    }
  ];

  if (!showForm) {
    return (
      <div className={`${styles.container} animate-fade-in`}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Journal Entries</h1>
            <p className={styles.subtitle}>View your accounting history.</p>
          </div>
          <div className={styles.actions}>
            <Button icon={Plus} onClick={() => { resetForm(); setShowForm(true); }}>New Journal Entry</Button>
          </div>
        </div>

        {isLoading ? (
          <div>Loading history...</div>
        ) : journalHistory.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
            <p>No journal entries found. Click "New Journal Entry" to get started.</p>
          </div>
        ) : (
          <Table 
            columns={columns} 
            data={journalHistory} 
            itemsPerPage={10} 
          />
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{editingId ? 'Edit Journal Entry' : 'New Journal Entry'}</h1>
          <p className={styles.subtitle}>{editingId ? 'Modify an existing accounting transaction' : 'Record a manual accounting transaction'}</p>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" icon={ArrowLeft} onClick={() => { resetForm(); setShowForm(false); }}>Back to History</Button>
          <Button icon={Save} disabled={!isBalanced || isSaving} onClick={handlePostEntry}>
            {isSaving ? 'Posting...' : (editingId ? 'Save Changes' : 'Post Entry')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Entry Details" />
        <CardContent className={styles.topDetails}>
          <div className={styles.inputGroup}>
            <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <Input label="Reference No." value={reference} onChange={e => setReference(e.target.value)} />
            <Input label="Memo" placeholder="Description for this journal entry" className={styles.memoInput} value={memo} onChange={e => setMemo(e.target.value)} />
          </div>
        </CardContent>

        <div className={styles.workspace}>
          <div className={styles.tableHeader}>
            <div className={styles.colAccount}>Account</div>
            <div className={styles.colDesc}>Description</div>
            <div className={styles.colDebit}>Debit</div>
            <div className={styles.colCredit}>Credit</div>
            <div className={styles.colAction}></div>
          </div>

          <div className={styles.tableBody}>
            {entries.map((entry) => (
              <div key={entry.id} className={styles.row}>
                <div className={styles.colAccount}>
                  <select 
                    className={styles.selectAccount}
                    value={entry.accountId}
                    onChange={e => updateEntry(entry.id, 'accountId', e.target.value)}
                  >
                    <option value="">Select Account...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                    ))}
                  </select>
                </div>
                <div className={styles.colDesc}>
                  <Input 
                    placeholder="Description" 
                    value={entry.description}
                    onChange={e => updateEntry(entry.id, 'description', e.target.value)}
                  />
                </div>
                <div className={styles.colDebit}>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={entry.debit || ''}
                    onChange={e => updateEntry(entry.id, 'debit', e.target.value)}
                    className={styles.numInput}
                  />
                </div>
                <div className={styles.colCredit}>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={entry.credit || ''}
                    onChange={e => updateEntry(entry.id, 'credit', e.target.value)}
                    className={styles.numInput}
                  />
                </div>
                <div className={styles.colAction}>
                  <button className={styles.iconBtn} onClick={() => removeEntry(entry.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.tableFooter}>
            <Button variant="ghost" icon={Plus} onClick={addEntry} size="sm">Add Line</Button>
            <div className={styles.totalsContainer}>
              <div className={styles.totalsBox}>
                <span className={styles.totalLabel}>Total Debit</span>
                <span className={styles.totalValue}>${totalDebit.toFixed(2)}</span>
              </div>
              <div className={styles.totalsBox}>
                <span className={styles.totalLabel}>Total Credit</span>
                <span className={styles.totalValue}>${totalCredit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.statusFooter}>
          {isBalanced ? (
            <div className={styles.statusBalanced}>
              <CheckCircle2 size={18} />
              <span>Debits equal credits. Ready to post.</span>
            </div>
          ) : (
            <div className={styles.statusUnbalanced}>
              <AlertCircle size={18} />
              <span>Out of balance by ${Math.abs(totalDebit - totalCredit).toFixed(2)}. Debits must equal credits.</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}


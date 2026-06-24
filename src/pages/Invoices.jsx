import React, { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Search, FileText, Filter, Download, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { InvoiceModal } from '../components/InvoiceModal';
import { InvoicePreviewModal } from '../components/InvoicePreviewModal';
import { RoleGuard } from '../components/RoleGuard';
import * as XLSX from 'xlsx';
import styles from './Invoices.module.css';

export function Invoices() {
  const { token, user } = useAuth();
  const canEdit = ['Owner', 'Admin', 'Editor'].includes(user?.role);
  const { formatCurrency } = useSettings();
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const formatted = data.map(inv => ({
          ...inv,
          date: new Date(inv.date).toISOString().split('T')[0],
          dueDate: new Date(inv.dueDate).toISOString().split('T')[0]
        }));
        setInvoices(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch invoices', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchInvoices();
  }, [token]);

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchInvoices();
    } catch (err) {
      console.error('Failed to delete invoice', err);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      const response = await fetch(`/api/invoices/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: 'Paid' })
      });
      if (response.ok) fetchInvoices();
    } catch (err) {
      console.error('Failed to mark invoice as paid', err);
    }
  };

  const columns = [
    { header: 'Invoice ID', key: 'invoiceId', sortable: true },
    { header: 'Client', key: 'client', sortable: true },
    { header: 'Date', key: 'date', sortable: true },
    { header: 'Due Date', key: 'dueDate', sortable: true },
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
      render: (val, invoice) => {
        let variant = 'default';
        if (val === 'Paid') variant = 'success';
        if (val === 'Overdue') variant = 'error';
        if (val === 'Sent') variant = 'info';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Badge variant={variant}>{val}</Badge>
            {val === 'Paid' && invoice.updatedAt && (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Paid on {new Date(invoice.updatedAt).toLocaleDateString()} {new Date(invoice.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            )}
          </div>
        );
      }
    },
    ...(canEdit ? [{
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, invoice) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {invoice.status !== 'Paid' && (
            <Button variant="ghost" size="sm" icon={CheckCircle2} onClick={() => handleMarkPaid(invoice.id)} title="Mark as Paid" style={{ color: 'var(--color-emerald)' }} />
          )}
          <Button variant="ghost" size="sm" icon={FileText} onClick={() => setPreviewInvoice(invoice)} title="Preview & Print PDF" />
          <Button variant="ghost" size="sm" icon={Edit2} onClick={() => handleEdit(invoice)} title="Edit Invoice" />
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(invoice.id)} style={{ color: 'var(--color-red)' }} title="Delete Invoice" />
        </div>
      )
    }] : [])
  ];

  const handleExportExcel = () => {
    const formattedData = invoices.map(inv => ({
      'Invoice ID': inv.invoiceId,
      Client: inv.client,
      Date: inv.date,
      'Due Date': inv.dueDate,
      Amount: formatCurrency(inv.amount),
      Status: inv.status
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedData);
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, 'Invoices.xlsx');
  };

  const filteredData = invoices.filter(inv => {
    const matchesSearch = inv.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.status.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' ? true : inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices</h1>
          <p className={styles.subtitle}>Manage your billing and track payments.</p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" icon={Download} onClick={handleExportExcel} disabled={isLoading || invoices.length === 0}>Export</Button>
          <RoleGuard allowedRoles={['Owner', 'Admin', 'Editor']}>
            <Button icon={Plus} onClick={() => { setEditingInvoice(null); setIsModalOpen(true); }}>Create Invoice</Button>
          </RoleGuard>
        </div>
      </div>

      <div className={styles.filters}>
        <Input 
          icon={Search} 
          placeholder="Search clients or invoice IDs..." 
          containerClassName={styles.searchContainer} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
        >
          <option value="All">Status: All</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {isLoading ? (
        <div>Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
          <p>No invoices found. Click "Create Invoice" to get started.</p>
        </div>
      ) : (
        <Table 
          columns={columns} 
          data={filteredData} 
          itemsPerPage={10} 
        />
      )}

      <InvoiceModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingInvoice(null); }} 
        onInvoiceAdded={fetchInvoices} 
        initialData={editingInvoice}
      />

      <InvoicePreviewModal 
        invoice={previewInvoice} 
        onClose={() => setPreviewInvoice(null)} 
      />
    </div>
  );
}


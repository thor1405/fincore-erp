import React, { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { VendorModal } from '../components/VendorModal';
import { RoleGuard } from '../components/RoleGuard';
import styles from './Vendors.module.css';

export function Vendors() {
  const { token, user } = useAuth();
  const canEdit = ['Owner', 'Admin', 'Editor'].includes(user?.role);
  const [vendors, setVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vendors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setVendors(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch vendors', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchVendors();
  }, [token]);

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchVendors();
    } catch (err) {
      console.error('Failed to delete vendor', err);
    }
  };

  const columns = [
    { header: 'Name', key: 'name', sortable: true },
    { header: 'Category', key: 'category', sortable: true },
    { header: 'Contact', key: 'contact', sortable: false },
    { 
      header: 'Status', 
      key: 'status', 
      sortable: true,
      render: (val) => <Badge variant={val === 'Active' ? 'success' : 'default'}>{val}</Badge>
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

  const filteredData = vendors.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vendors</h1>
          <p className={styles.subtitle}>Manage your suppliers and contractors.</p>
        </div>
        <div className={styles.actions}>
          <RoleGuard allowedRoles={['Owner', 'Admin', 'Editor']}>
            <Button icon={Plus} onClick={() => { setEditingVendor(null); setIsModalOpen(true); }}>Add Vendor</Button>
          </RoleGuard>
        </div>
      </div>

      <div className={styles.filters}>
        <Input 
          icon={Search} 
          placeholder="Search vendors..." 
          containerClassName={styles.searchContainer} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="secondary" icon={Filter}>Status: All</Button>
      </div>

      {isLoading ? (
        <div>Loading vendors...</div>
      ) : vendors.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
          <p>No vendors found. Click "Add Vendor" to get started.</p>
        </div>
      ) : (
        <Table 
          columns={columns} 
          data={filteredData} 
          itemsPerPage={10} 
        />
      )}

      <VendorModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingVendor(null); }} 
        onVendorAdded={fetchVendors} 
        initialData={editingVendor}
      />
    </div>
  );
}


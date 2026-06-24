import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Mail, Phone, Hash, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import styles from './CustomerProfile.module.css';

export function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { formatCurrency } = useSettings();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/customers/${id}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setProfile(await response.json());
        } else {
          // Handle error, e.g., redirect or show message
          console.error('Failed to fetch profile');
          navigate('/customers');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && id) {
      fetchProfile();
    }
  }, [token, id, navigate]);

  if (isLoading) {
    return <div className={`${styles.container} animate-fade-in`} style={{ padding: '40px', textAlign: 'center' }}>Loading customer profile...</div>;
  }

  if (!profile) {
    return <div className={styles.container}>Profile not found</div>;
  }

  const invoiceColumns = [
    { 
      header: 'Invoice #', 
      key: 'invoiceId', 
      sortable: true,
      render: (val) => <span className={styles.invoiceId}>{val}</span>
    },
    { 
      header: 'Date', 
      key: 'date', 
      sortable: true,
      render: (val) => new Date(val).toLocaleDateString()
    },
    { 
      header: 'Due Date', 
      key: 'dueDate', 
      sortable: true,
      render: (val) => new Date(val).toLocaleDateString()
    },
    { 
      header: 'Amount', 
      key: 'amount', 
      align: 'right',
      sortable: true,
      render: (val) => <span className={styles.money}>{formatCurrency(val)}</span>
    },
    { 
      header: 'Status', 
      key: 'status', 
      sortable: true,
      render: (val, row) => {
        const isPastDue = new Date(row.dueDate).getTime() < new Date().getTime() && val !== 'Paid' && val !== 'Draft';
        const displayStatus = isPastDue ? 'Overdue' : val;

        let variant = 'default';
        if (displayStatus === 'Paid') variant = 'success';
        if (displayStatus === 'Overdue') variant = 'destructive';
        if (displayStatus === 'Sent') variant = 'warning';
        return <Badge variant={variant}>{displayStatus}</Badge>;
      }
    }
  ];

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{profile.customer.name}</h1>
          <p className={styles.subtitle}>
            Customer since {new Date(profile.customer.createdAt).toLocaleDateString()}
            <Badge variant={profile.customer.status === 'Active' ? 'success' : 'default'} style={{ marginLeft: '12px' }}>
              {profile.customer.status}
            </Badge>
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/customers')}>Back to Customers</Button>
        </div>
      </div>

      <div className={styles.profileGrid}>
        {/* Contact Information */}
        <Card>
          <CardHeader title="Contact Details" />
          <CardContent className={styles.contactInfo}>
            <div className={styles.infoRow}>
              <Mail size={18} className={styles.infoIcon} />
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{profile.customer.email || 'Not provided'}</span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <Phone size={18} className={styles.infoIcon} />
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>{profile.customer.phone || 'Not provided'}</span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <Hash size={18} className={styles.infoIcon} />
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Customer ID</span>
                <span className={styles.infoValue} style={{ fontFamily: 'monospace' }}>{profile.customer.id.substring(profile.customer.id.length - 8)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial KPIs */}
        <div className={styles.kpiGrid}>
          <Card>
            <CardContent className={styles.kpiCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 className={styles.kpiTitle}>Lifetime Value</h3>
                <TrendingUp size={20} color="var(--color-emerald)" />
              </div>
              <div className={styles.kpiValueRow}>
                <h2 className={styles.kpiValue}>{formatCurrency(profile.metrics.lifetimeValue)}</h2>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Total revenue from {profile.metrics.invoiceCount} invoices
              </p>
            </CardContent>
          </Card>

          <Card style={profile.metrics.overdueAmount > 0 ? { borderColor: 'var(--color-red)', backgroundColor: 'rgba(239, 68, 68, 0.02)' } : {}}>
            <CardContent className={styles.kpiCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 className={styles.kpiTitle} style={profile.metrics.overdueAmount > 0 ? { color: 'var(--color-red)' } : {}}>Overdue Balance</h3>
                {profile.metrics.overdueAmount > 0 && <AlertCircle size={20} color="var(--color-red)" />}
              </div>
              <div className={styles.kpiValueRow}>
                <h2 className={styles.kpiValue} style={profile.metrics.overdueAmount > 0 ? { color: 'var(--color-red)' } : {}}>
                  {formatCurrency(profile.metrics.overdueAmount)}
                </h2>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: profile.metrics.overdueAmount > 0 ? 'var(--color-red)' : 'var(--text-muted)' }}>
                {profile.metrics.overdueAmount > 0 ? 'Requires immediate attention' : 'All clear'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className={styles.historySection}>
        <CardHeader title="Invoice History" subtitle="All invoices associated with this customer" />
        {profile.invoices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No invoices found for this customer.
          </div>
        ) : (
          <Table 
            columns={invoiceColumns} 
            data={profile.invoices} 
            itemsPerPage={10} 
          />
        )}
      </Card>
    </div>
  );
}

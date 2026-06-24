import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Phone, Hash, Tag, TrendingDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import styles from './VendorProfile.module.css';

export function VendorProfile() {
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
        const response = await fetch(`/api/vendors/${id}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setProfile(await response.json());
        } else {
          console.error('Failed to fetch profile');
          navigate('/vendors');
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
    return <div className={`${styles.container} animate-fade-in`} style={{ padding: '40px', textAlign: 'center' }}>Loading vendor profile...</div>;
  }

  if (!profile) {
    return <div className={styles.container}>Profile not found</div>;
  }

  const paymentColumns = [
    { 
      header: 'Date', 
      key: 'date', 
      sortable: true,
      render: (val) => new Date(val).toLocaleDateString()
    },
    { 
      header: 'Method', 
      key: 'method', 
      sortable: true
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
      render: (val) => {
        let variant = 'default';
        if (val === 'Completed') variant = 'success';
        if (val === 'Pending') variant = 'warning';
        if (val === 'Failed') variant = 'destructive';
        return <Badge variant={variant}>{val}</Badge>;
      }
    }
  ];

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{profile.vendor.name}</h1>
          <p className={styles.subtitle}>
            Vendor since {new Date(profile.vendor.createdAt).toLocaleDateString()}
            <Badge variant={profile.vendor.status === 'Active' ? 'success' : 'default'} style={{ marginLeft: '12px' }}>
              {profile.vendor.status}
            </Badge>
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/vendors')}>Back to Vendors</Button>
        </div>
      </div>

      <div className={styles.profileGrid}>
        {/* Contact Information */}
        <Card>
          <CardHeader title="Vendor Details" />
          <CardContent className={styles.contactInfo}>
            <div className={styles.infoRow}>
              <Tag size={18} className={styles.infoIcon} />
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Category</span>
                <span className={styles.infoValue}>{profile.vendor.category || 'Not categorized'}</span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <Phone size={18} className={styles.infoIcon} />
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Contact Info</span>
                <span className={styles.infoValue}>{profile.vendor.contact || 'Not provided'}</span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <Hash size={18} className={styles.infoIcon} />
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Vendor ID</span>
                <span className={styles.infoValue} style={{ fontFamily: 'monospace' }}>{profile.vendor.id.substring(profile.vendor.id.length - 8)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial KPIs */}
        <div className={styles.kpiGrid}>
          <Card>
            <CardContent className={styles.kpiCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 className={styles.kpiTitle}>Total Spend</h3>
                <TrendingDown size={20} color="var(--color-red)" />
              </div>
              <div className={styles.kpiValueRow}>
                <h2 className={styles.kpiValue}>{formatCurrency(profile.metrics.totalSpend)}</h2>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Total amount paid across {profile.metrics.paymentCount} payments
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className={styles.historySection}>
        <CardHeader title="Payment History" subtitle="All payments made to this vendor" />
        {profile.payments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No payments found for this vendor.
          </div>
        ) : (
          <Table 
            columns={paymentColumns} 
            data={profile.payments} 
            itemsPerPage={10} 
          />
        )}
      </Card>
    </div>
  );
}

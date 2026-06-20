import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Building, Shield, Bell, Users, Save, Plus, Mail, Smartphone, AlertCircle, Key, CheckCircle, ShieldCheck, X } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import styles from './Settings.module.css';

export function Settings() {
  const { token, user } = useAuth();
  const { settings, updateSettings } = useSettings();
  
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile & Preferences State
  const [formData, setFormData] = useState({
    companyName: '', taxId: '', email: '', phone: '', address: '', city: '', state: '', currency: 'USD',
    twoFactorEnabled: false, emailInvoices: true, emailReports: true, emailSecurity: true, pushApprovals: false, pushOverdue: true
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Security State
  const [securityData, setSecurityData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [securityStatus, setSecurityStatus] = useState(null);
  
  const [teamMembers, setTeamMembers] = useState([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'Viewer' });
  const [isInviting, setIsInviting] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || '',
        taxId: settings.taxId || '',
        email: settings.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        city: settings.city || '',
        state: settings.state || '',
        currency: settings.currency || 'USD',
        twoFactorEnabled: settings.twoFactorEnabled ?? false,
        emailInvoices: settings.emailInvoices ?? true,
        emailReports: settings.emailReports ?? true,
        emailSecurity: settings.emailSecurity ?? true,
        pushApprovals: settings.pushApprovals ?? false,
        pushOverdue: settings.pushOverdue ?? true
      });
    }
  }, [settings]);

  useEffect(() => {
    if (token && activeTab === 'users') {
      fetchTeamMembers();
    }
  }, [token, activeTab]);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setTeamMembers(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch team members', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await updateSettings(formData);
    setIsSaving(false);
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      setSecurityStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    if (!securityData.currentPassword || !securityData.newPassword) {
      setSecurityStatus({ type: 'error', message: 'All fields are required' });
      return;
    }

    try {
      setSecurityStatus({ type: 'info', message: 'Updating password...' });
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSecurityStatus({ type: 'success', message: 'Password successfully updated' });
        setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setSecurityStatus({ type: 'error', message: data.error || 'Failed to update password' });
      }
    } catch (err) {
      setSecurityStatus({ type: 'error', message: 'Network error occurred' });
    }
  };

  const handleInviteUser = async () => {
    if (!inviteData.name || !inviteData.email) return;
    setIsInviting(true);
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(inviteData)
      });
      if (response.ok) {
        const { member, inviteLink } = await response.json();
        setTeamMembers(prev => [...prev, member]);
        setIsInviteModalOpen(false);
        setInviteData({ name: '', email: '', role: 'Viewer' });
        setGeneratedInviteLink(inviteLink);
      }
    } catch (err) {
      console.error('Failed to invite user', err);
    } finally {
      setIsInviting(false);
    }
  };

  const togglePreference = async (key) => {
    const newValue = !formData[key];
    setFormData(prev => ({ ...prev, [key]: newValue }));
    await updateSettings({ ...formData, [key]: newValue });
  };

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage your company profile and preferences.</p>
        </div>
        {activeTab === 'profile' && (
          <div className={styles.actions}>
            <Button icon={Save} onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <button className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`} onClick={() => setActiveTab('profile')}>
            <Building size={18} /> Company Profile
          </button>
          <button className={`${styles.navItem} ${activeTab === 'users' ? styles.active : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={18} /> Users & Roles
          </button>
          <button className={`${styles.navItem} ${activeTab === 'security' ? styles.active : ''}`} onClick={() => setActiveTab('security')}>
            <Shield size={18} /> Security
          </button>
          <button className={`${styles.navItem} ${activeTab === 'notifications' ? styles.active : ''}`} onClick={() => setActiveTab('notifications')}>
            <Bell size={18} /> Notifications
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'profile' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Card>
                <CardHeader title="Company Details" subtitle="Update your business information" />
                <CardContent className={styles.formGrid}>
                  <Input label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} />
                  <Input label="Tax ID / EIN" name="taxId" value={formData.taxId} onChange={handleChange} />
                  <Input label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" />
                  <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
                  <Input label="Address Line 1" name="address" value={formData.address} onChange={handleChange} fullWidth containerClassName={styles.fullSpan} />
                  <Input label="City" name="city" value={formData.city} onChange={handleChange} />
                  <Input label="State/Province" name="state" value={formData.state} onChange={handleChange} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Financial Settings" subtitle="Configure your accounting preferences" />
                <CardContent className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Reporting Currency</label>
                    <select name="currency" value={formData.currency} onChange={handleChange} className={styles.select}>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                      <option value="JPY">Japanese Yen (¥)</option>
                      <option value="AUD">Australian Dollar (A$)</option>
                      <option value="CAD">Canadian Dollar (C$)</option>
                      <option value="INR">Indian Rupee (₹)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Card>
                <CardHeader 
                  title="Team Members" 
                  subtitle="Manage who has access to your workspace" 
                  action={<Button size="sm" icon={Plus} onClick={() => setIsInviteModalOpen(true)}>Invite User</Button>}
                />
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Name</th>
                        <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Email</th>
                        <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Role</th>
                        <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '16px', fontWeight: 500 }}>{user?.name || 'Primary User'}</td>
                        <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{user?.email}</td>
                        <td style={{ padding: '16px' }}><span style={{ backgroundColor: 'var(--color-indigo)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Owner</span></td>
                        <td style={{ padding: '16px' }}><span style={{ color: 'var(--color-emerald)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Active</span></td>
                      </tr>
                      {teamMembers.map(member => (
                        <tr key={member.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '16px', fontWeight: 500 }}>{member.name}</td>
                          <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{member.email}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--border-color)' }}>{member.role}</span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ color: 'var(--color-amber)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {member.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {isInviteModalOpen && (
                <Card>
                  <CardHeader title="Invite Team Member" subtitle="Send an email invitation" action={<button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setIsInviteModalOpen(false)}><X size={20} color="var(--text-secondary)" /></button>} />
                  <CardContent className={styles.formGrid}>
                    <Input label="Full Name" value={inviteData.name} onChange={e => setInviteData(p => ({...p, name: e.target.value}))} />
                    <Input label="Email Address" type="email" value={inviteData.email} onChange={e => setInviteData(p => ({...p, email: e.target.value}))} />
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Role</label>
                      <select value={inviteData.role} onChange={e => setInviteData(p => ({...p, role: e.target.value}))} className={styles.select}>
                        <option value="Admin">Admin</option>
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </div>
                    <div className={styles.fullSpan} style={{ marginTop: '16px' }}>
                      <Button onClick={handleInviteUser} disabled={!inviteData.name || !inviteData.email || isInviting}>
                        {isInviting ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {generatedInviteLink && (
                <Card>
                  <CardHeader title="Invitation Created!" subtitle="Share this link with your team member to let them accept the invite." icon={<CheckCircle size={18} color="var(--color-emerald)" />} action={<button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setGeneratedInviteLink('')}><X size={20} color="var(--text-secondary)" /></button>} />
                  <CardContent>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Input value={generatedInviteLink} readOnly containerClassName={styles.fullSpan} style={{ marginBottom: 0, flex: 1 }} />
                      <Button onClick={() => navigator.clipboard.writeText(generatedInviteLink)} variant="outline">Copy Link</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Card>
                <CardHeader title="Change Password" subtitle="Ensure your account is using a long, random password to stay secure." icon={<Key size={18} color="var(--color-indigo)" />} />
                <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                  {securityStatus && (
                    <div style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      backgroundColor: securityStatus.type === 'error' ? '#fee2e2' : securityStatus.type === 'success' ? '#dcfce7' : '#e0e7ff',
                      color: securityStatus.type === 'error' ? '#991b1b' : securityStatus.type === 'success' ? '#166534' : '#3730a3',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {securityStatus.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                      {securityStatus.message}
                    </div>
                  )}
                  <Input label="Current Password" type="password" name="currentPassword" value={securityData.currentPassword} onChange={handleSecurityChange} />
                  <Input label="New Password" type="password" name="newPassword" value={securityData.newPassword} onChange={handleSecurityChange} />
                  <Input label="Confirm New Password" type="password" name="confirmPassword" value={securityData.confirmPassword} onChange={handleSecurityChange} />
                  <Button onClick={handleChangePassword} style={{ marginTop: '8px' }}>Update Password</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Two-Factor Authentication" subtitle="Add additional security to your account using 2FA apps." icon={<ShieldCheck size={18} color={formData.twoFactorEnabled ? "var(--color-emerald)" : "var(--text-secondary)"} />} />
                <CardContent style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>
                      Authenticator App
                      {formData.twoFactorEnabled && <span style={{ marginLeft: '8px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Enabled</span>}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Use an app like Google Authenticator to get 2FA codes.</p>
                  </div>
                  <Button variant={formData.twoFactorEnabled ? "danger" : "outline"} onClick={() => togglePreference('twoFactorEnabled')}>
                    {formData.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Card>
                <CardHeader title="Email Notifications" subtitle="Choose what updates you want to receive via email." icon={<Mail size={18} color="var(--color-blue)" />} />
                <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { key: 'emailInvoices', title: 'Invoice Updates', desc: 'Get notified when an invoice is viewed or paid.' },
                    { key: 'emailReports', title: 'Weekly Financial Summary', desc: 'Receive a weekly digest of your cash flow and KPIs.' },
                    { key: 'emailSecurity', title: 'Security Alerts', desc: 'Important notifications about your account security.' }
                  ].map(item => (
                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>{item.title}</p>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
                      </div>
                      <div 
                        onClick={() => togglePreference(item.key)}
                        style={{ 
                          width: '44px', height: '24px', borderRadius: '12px', 
                          backgroundColor: formData[item.key] ? 'var(--color-indigo)' : 'var(--border-color)', 
                          cursor: 'pointer', position: 'relative', transition: 'all 0.2s' 
                        }}>
                        <div style={{ 
                          width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', 
                          position: 'absolute', top: '2px', left: formData[item.key] ? '22px' : '2px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                        }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Push Notifications" subtitle="Alerts delivered directly to your device." icon={<Smartphone size={18} color="var(--color-amber)" />} />
                <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { key: 'pushApprovals', title: 'Transaction Approvals', desc: 'Alert me when a large transaction needs approval.' },
                    { key: 'pushOverdue', title: 'Overdue Invoices', desc: 'Daily alerts for invoices that are past due.' }
                  ].map(item => (
                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>{item.title}</p>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
                      </div>
                      <div 
                        onClick={() => togglePreference(item.key)}
                        style={{ 
                          width: '44px', height: '24px', borderRadius: '12px', 
                          backgroundColor: formData[item.key] ? 'var(--color-indigo)' : 'var(--border-color)', 
                          cursor: 'pointer', position: 'relative', transition: 'all 0.2s' 
                        }}>
                        <div style={{ 
                          width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', 
                          position: 'absolute', top: '2px', left: formData[item.key] ? '22px' : '2px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                        }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


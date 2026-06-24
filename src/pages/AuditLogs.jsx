import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './AuditLogs.module.css';
import { ShieldAlert, Search } from 'lucide-react';

export function AuditLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('All');
  const [filterUser, setFilterUser] = useState('All');

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getModuleColor = (module) => {
    switch (module) {
      case 'Transactions': return 'var(--color-blue)';
      case 'Settings': return 'var(--color-indigo)';
      case 'Profile': return 'var(--color-emerald)';
      case 'Invoices': return 'var(--color-amber)';
      case 'Authentication': return 'var(--color-red)';
      default: return 'var(--color-gray-500)';
    }
  };

  const uniqueUsers = ['All', ...new Set(logs.map(l => l.actor?.name || 'System'))];
  const uniqueModules = ['All', ...new Set(logs.map(l => l.module))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesModule = filterModule === 'All' || log.module === filterModule;
    const actorName = log.actor?.name || 'System';
    const matchesUser = filterUser === 'All' || actorName === filterUser;
    return matchesSearch && matchesModule && matchesUser;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Audit Logs</h1>
          <p className={styles.subtitle}>Track all critical actions and changes across your account.</p>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select 
          className={styles.filterSelect}
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
        >
          {uniqueModules.map(m => (
            <option key={m} value={m}>Module: {m}</option>
          ))}
        </select>
        <select 
          className={styles.filterSelect}
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
        >
          {uniqueUsers.map(u => (
            <option key={u} value={u}>User: {u}</option>
          ))}
        </select>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Module</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className={styles.emptyState}>Loading logs...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className={styles.emptyState}>
                  <ShieldAlert size={32} className={styles.emptyIcon} />
                  <p>No audit logs found matching your criteria.</p>
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id}>
                  <td className={styles.timeCell}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className={styles.userCell}>
                    <div className={styles.userBadge}>
                      <div className={styles.userAvatar}>
                        {(log.actor?.name || 'S')[0].toUpperCase()}
                      </div>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{log.actor?.name || 'System'}</span>
                        {log.actor?.email && <span className={styles.userEmail}>{log.actor.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.moduleBadge} style={{ backgroundColor: getModuleColor(log.module) }}>
                      {log.module}
                    </span>
                  </td>
                  <td className={styles.actionCell}>{log.action}</td>
                  <td className={styles.detailsCell}>{log.details || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


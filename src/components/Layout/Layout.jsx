import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  BookOpen,
  Users,
  Building2,
  FileText,
  CreditCard,
  Banknote,
  PieChart,
  ShieldAlert,
  MonitorOff,
  Settings,
  Bell,
  Search,
  Sun,
  Moon,
  Menu,
  LogOut,
  User,
  HelpCircle,
  Sparkles,
  Target,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileModal } from '../ProfileModal';
import { OnboardingTour } from '../OnboardingTour';
import styles from './Layout.module.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Wallet, label: 'Accounts', path: '/accounts' },
  { icon: ArrowRightLeft, label: 'Transactions', path: '/transactions' },
  { icon: BookOpen, label: 'Journal Entries', path: '/journal' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: Building2, label: 'Vendors', path: '/vendors' },
  { icon: FileText, label: 'Invoices', path: '/invoices' },
  { icon: Target, label: 'Budgets', path: '/budgets' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: Banknote, label: 'Payroll', path: '/payroll' },
  { icon: PieChart, label: 'Reports', path: '/reports' },
  { icon: FileText, label: 'Taxes', path: '/taxes' },
  { icon: MonitorOff, label: 'SaaS Leakage', path: '/saas' },
  { icon: Sparkles, label: 'AI Predictor', path: '/ai' },
  { icon: ShieldAlert, label: 'Audit Logs', path: '/audit' },
];

export function Layout() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchRef = useRef(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [tourRun, setTourRun] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationRoute = (notif) => {
    if (notif.link || notif.url) return notif.link || notif.url;
    const t = (notif.title || '').toLowerCase();
    const m = (notif.message || '').toLowerCase();

    if (t.includes('invoice') || m.includes('invoice') || m.includes('inv-')) return '/invoices';
    if (t.includes('budget') || m.includes('budget')) return '/budgets';
    if (t.includes('transaction') || m.includes('transaction') || t.includes('approval') || t.includes('expense')) return '/transactions';
    if (t.includes('bank') || t.includes('account') || m.includes('bank')) return '/accounts';
    if (t.includes('customer') || m.includes('customer')) return '/customers';
    if (t.includes('vendor') || m.includes('vendor')) return '/vendors';
    if (t.includes('payment') || m.includes('payment')) return '/payments';
    if (t.includes('payroll') || m.includes('payroll')) return '/payroll';
    if (t.includes('report') || m.includes('report')) return '/reports';
    if (t.includes('tax') || m.includes('tax')) return '/taxes';
    if (t.includes('saas') || m.includes('saas')) return '/saas';
    if (t.includes('ai') || m.includes('ai')) return '/ai';
    if (t.includes('audit') || m.includes('audit')) return '/audit';
    return '/';
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    const targetRoute = getNotificationRoute(notif);
    navigate(targetRoute);
    setNotificationsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (globalSearchQuery.trim()) {
        performSearch(globalSearchQuery);
      } else {
        setGlobalSearchResults([]);
        setSearchDropdownOpen(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [globalSearchQuery, token]);

  const performSearch = async (query) => {
    if (!token) return;
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setGlobalSearchResults(await response.json());
        setSearchDropdownOpen(true);
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Check if the user has completed the tour
    const isTourCompleted = localStorage.getItem('fincore_tour_completed');
    if (isTourCompleted !== 'true') {
      setTourRun(true);
      // Mark it as completed immediately so that hitting refresh or closing the tab 
      // doesn't cause it to endlessly pop up on subsequent loads.
      localStorage.setItem('fincore_tour_completed', 'true');
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside id="tour-sidebar" className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>FC</div>
            {sidebarOpen && <span className={styles.logoText}>FinCore</span>}
          </div>
          <button className={styles.toggleBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>MENU</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              title={item.label}
            >
              <item.icon size={20} className={styles.navIcon} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
          
          <div className={styles.spacer} />
          <div className={styles.navSection}>SYSTEM</div>
          <NavLink to="/settings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} title="Settings">
            <Settings size={20} className={styles.navIcon} />
            {sidebarOpen && <span>Settings</span>}
          </NavLink>
        </nav>
      </aside>

      {/* Main Workspace */}
      <main className={styles.main}>
        {/* Top Header */}
        <header className={styles.header}>
          <div id="tour-search" className={styles.searchContainer} ref={searchRef}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search accounts, transactions, or contacts..." 
              className={styles.searchInput} 
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              onFocus={() => { if (globalSearchResults.length > 0) setSearchDropdownOpen(true); }}
            />
            {searchDropdownOpen && globalSearchQuery.trim() !== '' && (
              <div className={styles.searchDropdown}>
                {isSearching ? (
                  <div className={styles.searchEmpty}>Searching...</div>
                ) : globalSearchResults.length === 0 ? (
                  <div className={styles.searchEmpty}>No results found for "{globalSearchQuery}"</div>
                ) : (
                  globalSearchResults.map(result => (
                    <div key={result.id} className={styles.searchResultItem}>
                      <span className={styles.searchResultType}>{result.type}</span>
                      <p className={styles.searchResultTitle}>{result.title}</p>
                      <p className={styles.searchResultSubtitle}>{result.subtitle}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className={styles.headerActions}>
            <button className={styles.iconBtn} onClick={() => setTourRun(true)} aria-label="Start Tour" title="Start Tour">
              <HelpCircle size={20} />
            </button>
            <button className={styles.iconBtn} onClick={toggleTheme} aria-label="Toggle Theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className={styles.notifContainer} ref={notifRef}>
              <button 
                className={styles.iconBtn} 
                aria-label="Notifications"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
              </button>
              
              {notificationsOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button className={styles.markAllRead} onClick={handleMarkAllAsRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className={styles.notifList}>
                    {notifications.length === 0 ? (
                      <div className={styles.notifEmpty}>No notifications yet</div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`${styles.notifItem} ${notif.isRead ? styles.read : styles.unread}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className={styles.notifIconWrapper}>
                            {notif.type === 'alert' ? <AlertCircle size={16} className={styles.notifAlert} /> :
                             notif.type === 'success' ? <CheckCircle2 size={16} className={styles.notifSuccess} /> :
                             <Info size={16} className={styles.notifInfo} />}
                          </div>
                          <div className={styles.notifContent}>
                            <p className={styles.notifTitle}>{notif.title}</p>
                            <p className={styles.notifMessage}>{notif.message}</p>
                            <span className={styles.notifTime}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                          </div>
                          {!notif.isRead && <div className={styles.unreadDot} />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div id="tour-profile" className={styles.userMenuContainer} ref={dropdownRef}>
              <div 
                className={styles.avatar} 
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {getInitials(user?.name)}
              </div>
              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>
                      {user?.name}
                      {user?.role === 'Viewer' && (
                        <span style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 6px', backgroundColor: 'var(--color-amber)', color: 'white', borderRadius: '4px' }}>Viewer</span>
                      )}
                    </p>
                    <p className={styles.dropdownEmail}>{user?.email}</p>
                  </div>
                  <button className={styles.dropdownItem} onClick={() => {
                    setDropdownOpen(false);
                    setProfileModalOpen(true);
                  }}>
                    <User size={16} /> Edit Profile
                  </button>
                  <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={handleLogout}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>

      <ProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
      />

      <OnboardingTour run={tourRun} setRun={setTourRun} />
    </div>
  );
}


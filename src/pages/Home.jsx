import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, ShieldCheck, Activity, Sparkles, Cpu, Server, 
  TrendingUp, PieChart, ArrowRight, Lock, Sun, Moon, Terminal, 
  AlertTriangle, FileText, MessageSquare, DollarSign, Globe, 
  HelpCircle, Zap, Database, BarChart3, Layers, Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../components/ThemeProvider';
import styles from './Home.module.css';

export function Home() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handlePortalLaunch = () => {
    if (user) {
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className={styles.homeContainer}>
      {/* Top Navigation Bar */}
      <header className={styles.header}>
        <div className={styles.navInner}>
          <Link to="/home" className={styles.brand}>
            <div className={styles.brandIconBox}>FC</div>
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>FinCore ERP</span>
              <span className={styles.brandSubtitle}>Automated Engine</span>
            </div>
          </Link>

          <nav className={styles.navLinks}>
            <a href="#overview" className={styles.navLink}>Overview</a>
            <a href="#features" className={styles.navLink}>Core Pillars</a>
            <a href="#saas-leakage" className={styles.navLink}>AI & Leakage Engine</a>
            <a href="#why-choose" className={styles.navLink}>Why Choose Us</a>
            <a href="#about" className={styles.navLink}>About Us</a>
          </nav>

          <div className={styles.navActions}>
            <button 
              className={styles.themeBtn} 
              onClick={toggleTheme} 
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={handlePortalLaunch} className={styles.btnPrimary}>
              <span>{user ? 'Launch Dashboard' : 'Sign In to Portal'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroGlow1} />
        <div className={styles.heroGlow2} />
        <div className={styles.heroContent}>
          <div className={styles.badgePill}>
            <Sparkles size={14} />
            <span>Next-Gen Self-Hosted AI Financial Intelligence Engine</span>
          </div>

          <h1 className={styles.heroTitle}>
            The Intelligent CFO & <br />
            <span className={styles.highlightText}>Enterprise Ledger Platform</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Automate general ledgers, eliminate SaaS subscription revenue leakage, and generate audit-ready CFO executive scorecards—all powered by real-time conversational AI and hosted directly on edge infrastructure.
          </p>

          <div className={styles.heroCtas}>
            <button onClick={handlePortalLaunch} className={`${styles.btnPrimary} ${styles.btnLarge}`}>
              <span>Explore Live Platform</span>
              <ArrowRight size={18} />
            </button>
            <a href="#features" className={`${styles.btnOutline} ${styles.btnLarge}`}>
              <span>View System Architecture</span>
            </a>
          </div>

          {/* Interactive Live Ticker Bar */}
          <div className={styles.tickerBar}>
            <div className={styles.tickerItem}>
              <span className={styles.tickerValue}>$14.8M+</span>
              <span className={styles.tickerLabel}>Audited Ledger Flow</span>
            </div>
            <div className={styles.tickerItem}>
              <span className={styles.tickerValue}>99.99%</span>
              <span className={styles.tickerLabel}>Fallback Resilience</span>
            </div>
            <div className={styles.tickerItem}>
              <span className={styles.tickerValue}>0.12s</span>
              <span className={styles.tickerLabel}>AI Anomaly Scan Time</span>
            </div>
            <div className={styles.tickerItem}>
              <span className={styles.tickerValue}>100%</span>
              <span className={styles.tickerLabel}>Bare-Metal Edge Cloud</span>
            </div>
          </div>
        </div>
      </section>

      {/* Overview / Core Pillars Section */}
      <section id="overview" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Platform Overview</span>
          <h2 className={styles.sectionTitle}>Engineered for Financial Rigor & Speed</h2>
          <p className={styles.sectionDesc}>
            FinCore ERP transforms fragmented accounting sheets into an automated double-entry ledger ecosystem, giving executive leadership complete transparency over cash flow and compliance.
          </p>
        </div>

        <div className={styles.pillarGrid}>
          {/* Pillar 1 */}
          <div className={styles.pillarCard}>
            <div>
              <div className={styles.pillarIcon}>
                <Database size={26} />
              </div>
              <h3 className={styles.pillarTitle}>Automated General Ledger & Aging</h3>
              <p className={styles.pillarText}>
                Reconcile complex accounting entries across Accounts Receivable and Accounts Payable. Track 30/60/90+ day invoice aging buckets automatically without manual spreadsheet reconciliation.
              </p>
            </div>
            <ul className={styles.pillarList}>
              <li className={styles.pillarListItem}>
                <Check size={16} className={styles.checkIcon} /> Double-entry journal verification
              </li>
              <li className={styles.pillarListItem}>
                <Check size={16} className={styles.checkIcon} /> Automated AR/AP aging schedules
              </li>
              <li className={styles.pillarListItem}>
                <Check size={16} className={styles.checkIcon} /> Multi-currency transaction logs
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className={styles.pillarCard}>
            <div>
              <div className={styles.pillarIcon}>
                <MessageSquare size={26} />
              </div>
              <h3 className={styles.pillarTitle}>Conversational AI Financial Assistant</h3>
              <p className={styles.pillarText}>
                Interact with your corporate ledger using natural language. Ask complex diagnostic queries like "Show me our top 3 operational cost spikes this quarter" and receive instant charts and audit notes.
              </p>
            </div>
            <ul className={styles.pillarList}>
              <li className={styles.pillarListItem}>
                <Check size={16} className={styles.checkIcon} /> Instant natural language ledger queries
              </li>
              <li className={styles.pillarListItem}>
                <Check size={16} className={styles.checkIcon} /> Algorithmic health rating scorecards
              </li>
              <li className={styles.pillarListItem}>
                <Check size={16} className={styles.checkIcon} /> Predictive cash flow forecast engine
              </li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className={styles.pillarCard}>
            <div>
              <div className={styles.pillarIcon}>
                <FileText size={26} />
              </div>
              <h3 className={styles.pillarTitle}>CFO Executive Audit Report Engine</h3>
              <p className={styles.pillarText}>
                Generate vector-precision printable PDF financial documents with a single click. Features executive sign-off blocks, embedded SVG charts, and crisp formatting for board meetings.
              </p>
            </div>
            <ul className={styles.pillarList}>
              <li className={styles.pillarListItem}>
                <Check size={16} className={styles.checkIcon} /> 1-Click vector PDF print engine
              </li>
              <li className={styles.pillarListItem}>
                <Check size={16} className={styles.checkIcon} /> Multi-signature audit sign-off lines
              </li>
              <li className={styles.pillarListItem}>
                <Check size={16} className={styles.checkIcon} /> Zero third-party rendering bloat
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SaaS Leakage & AI Feature Spotlight */}
      <section id="saas-leakage" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Intelligent Auditing</span>
          <h2 className={styles.sectionTitle}>SaaS Revenue Leakage Detection</h2>
          <p className={styles.sectionDesc}>
            Subscription sprawl quietly drains corporate capital. FinCore’s algorithmic engine continuously scans recurring billing pipelines to detect duplicate licenses, forgotten trials, and uncollected invoices.
          </p>
        </div>

        <div className={styles.spotlightBox}>
          <div className={styles.spotlightLeft}>
            <div className={styles.badgePill} style={{ width: 'fit-content', marginBottom: 8 }}>
              <AlertTriangle size={14} />
              <span>Leakage Prevention Engine</span>
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 800 }}>Stop Paying for Ghost Subscriptions</h3>
            <p style={{ fontSize: 15.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              By cross-referencing ledger transactions against recurring billing signatures, our AI detector flags duplicate software tools, underutilized licenses, and upcoming renewals up to 60 days before charge execution.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
                <CheckCircle size={18} style={{ color: 'var(--color-emerald)' }} />
                <span>Algorithmic resilience with 99.9% fallback uptime guarantee</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
                <CheckCircle size={18} style={{ color: 'var(--color-emerald)' }} />
                <span>Automated identification of unbilled recurring subscriptions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
                <CheckCircle size={18} style={{ color: 'var(--color-emerald)' }} />
                <span>Instant export to audit-ready spreadsheet schedules</span>
              </div>
            </div>
          </div>

          <div className={styles.spotlightRight}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Live Leakage Audit Schedule
            </div>
            <div className={styles.leakageCard}>
              <div className={styles.leakageRow}>
                <div className={styles.leakageRowLeft}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                  <div>
                    <div className={styles.leakageApp}>CloudStorage Pro (Duplicate)</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Found 3 active seats under different cards</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`${styles.leakageTag} ${styles.tagDanger}`}>Leakage</span>
                  <div className={styles.leakageAmount}>-$1,420/mo</div>
                </div>
              </div>

              <div className={styles.leakageRow}>
                <div className={styles.leakageRowLeft}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                  <div>
                    <div className={styles.leakageApp}>DevTool Suite Enterprise</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>42% of assigned seats unused over 90 days</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`${styles.leakageTag} ${styles.tagWarn}`}>Underused</span>
                  <div className={styles.leakageAmount}>-$850/mo</div>
                </div>
              </div>

              <div className={styles.leakageRow}>
                <div className={styles.leakageRowLeft}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                  <div>
                    <div className={styles.leakageApp}>AWS Edge Cloud Infrastructure</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Migrated & self-hosted on Raspberry Pi edge</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`${styles.leakageTag} ${styles.tagSafe}`}>Optimized</span>
                  <div className={styles.leakageAmount} style={{ color: '#10b981' }}>+$3,200 Saved</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-choose" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Competitive Edge</span>
          <h2 className={styles.sectionTitle}>Why Enterprise Teams Choose FinCore</h2>
          <p className={styles.sectionDesc}>
            Unlike bloatware ERP suites that trap data behind proprietary vendor clouds, FinCore gives engineering and finance leaders total architectural autonomy.
          </p>
        </div>

        <div className={styles.whyGrid}>
          <div className={styles.whyCard}>
            <div className={styles.whyIconBox}>
              <Server size={24} />
            </div>
            <div className={styles.whyContent}>
              <h3 className={styles.whyTitle}>Bare-Metal Self-Hosted Edge Cloud</h3>
              <p className={styles.whyDesc}>
                Full deployment freedom. Host on your own Linux hardware or Raspberry Pi 5 edge infrastructure with Nginx reverse proxy routing and Cloudflare Zero Trust encryption—giving your CFO complete sovereignty over corporate data.
              </p>
            </div>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIconBox}>
              <Zap size={24} />
            </div>
            <div className={styles.whyContent}>
              <h3 className={styles.whyTitle}>Algorithmic Fallback Resilience</h3>
              <p className={styles.whyDesc}>
                Cloud APIs and external AI models occasionally timeout. FinCore features embedded algorithmic fallback heuristics (`saas.js`), ensuring your financial analytics continue calculating MRR/ARR with 99.9% guaranteed reliability.
              </p>
            </div>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIconBox}>
              <Lock size={24} />
            </div>
            <div className={styles.whyContent}>
              <h3 className={styles.whyTitle}>RoleGuard Granular Security (RBAC)</h3>
              <p className={styles.whyDesc}>
                Enforce strict segregation of duties between Executive leadership, Managing Auditors, and Accountants using JWT-verified access boundaries (`RoleGuard`) and immutable audit trail logs.
              </p>
            </div>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIconBox}>
              <Layers size={24} />
            </div>
            <div className={styles.whyContent}>
              <h3 className={styles.whyTitle}>Sub-Second UI & Glassmorphism Aesthetics</h3>
              <p className={styles.whyDesc}>
                Built on high-speed React 18 and Vite with a modern HSL design system. No heavy reloads or bloated JavaScript bundles—just instant, responsive financial visualizations that wow executive stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us & Mission Section */}
      <section id="about" className={styles.section}>
        <div className={styles.aboutContainer}>
          <div>
            <span className={styles.sectionTag}>About Our Engineering Mission</span>
            <h2 className={styles.sectionTitle} style={{ textAlign: 'left', margin: '12px 0 20px' }}>
              Built for Financial Technologists who Demand Precision
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
              FinCore ERP was born out of frustration with legacy enterprise software that takes minutes to load, costs tens of thousands in licensing fees, and locks critical financial data behind opaque proprietary APIs.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Our engineering philosophy is simple: combine strict double-entry accounting rigor with state-of-the-art full-stack web speed. Whether you are running a multi-million dollar SaaS operation or self-hosting on edge hardware, FinCore delivers uncompromising transparency and speed.
            </p>
          </div>

          <div className={styles.aboutStats}>
            <div className={styles.aboutStatCard}>
              <div className={styles.aboutStatNum}>100%</div>
              <div className={styles.aboutStatLabel}>Open Architectural Control</div>
            </div>
            <div className={styles.aboutStatCard}>
              <div className={styles.aboutStatNum}>10x</div>
              <div className={styles.aboutStatLabel}>Faster Report Generation</div>
            </div>
            <div className={styles.aboutStatCard}>
              <div className={styles.aboutStatNum}>3+</div>
              <div className={styles.aboutStatLabel}>Core AI & Audit Modules</div>
            </div>
            <div className={styles.aboutStatCard}>
              <div className={styles.aboutStatNum}>0</div>
              <div className={styles.aboutStatLabel}>Vendor Lock-in or Bloat</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <div className={styles.ctaBanner}>
        <h2 className={styles.ctaTitle}>Ready to Experience Automated Financial Precision?</h2>
        <p className={styles.ctaDesc}>
          Take control of your corporate ledgers, eliminate hidden SaaS leakage, and impress your board with vector-clean executive audit reports today.
        </p>
        <button onClick={handlePortalLaunch} className={`${styles.btnPrimary} ${styles.btnLarge}`} style={{ margin: '0 auto', background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}>
          <span>Launch FinCore Portal Now</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Neat & Professional Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          {/* Col 1: Brand */}
          <div className={styles.footerBrand}>
            <Link to="/home" className={styles.footerLogo}>
              <div className={styles.footerLogoIcon}>FC</div>
              <span>FinCore ERP</span>
            </Link>
            <p className={styles.footerMission}>
              Enterprise-grade financial intelligence, double-entry general ledgers, and conversational AI auditing engine.
            </p>
            <div className={styles.edgeBadge}>
              <Cpu size={14} />
              <span>Self-Hosted on Raspberry Pi Edge Cloud</span>
            </div>
          </div>

          {/* Col 2: Core Solutions */}
          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>Solutions</div>
            <ul className={styles.footerList}>
              <li><Link to="/login" className={styles.footerLink}>General Ledger & Accounting</Link></li>
              <li><Link to="/login" className={styles.footerLink}>Accounts Receivable & Aging</Link></li>
              <li><Link to="/login" className={styles.footerLink}>SaaS Revenue Leakage Audit</Link></li>
              <li><Link to="/login" className={styles.footerLink}>AI Financial Assistant Chat</Link></li>
              <li><Link to="/login" className={styles.footerLink}>CFO Executive Scorecards</Link></li>
            </ul>
          </div>

          {/* Col 3: Architecture & Tech */}
          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>Platform & Architecture</div>
            <ul className={styles.footerList}>
              <li><a href="#why-choose" className={styles.footerLink}>Bare-Metal Edge Self-Hosting</a></li>
              <li><a href="#why-choose" className={styles.footerLink}>Algorithmic Fallback Engine</a></li>
              <li><a href="#why-choose" className={styles.footerLink}>RoleGuard RBAC Security</a></li>
              <li><a href="#why-choose" className={styles.footerLink}>Nginx Reverse Proxy Routing</a></li>
              <li><a href="#overview" className={styles.footerLink}>Vector Print PDF Generator</a></li>
            </ul>
          </div>

          {/* Col 4: Governance & Legal */}
          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>Governance & Legal</div>
            <ul className={styles.footerList}>
              <li><a href="#about" className={styles.footerLink}>About Our Mission</a></li>
              <li><Link to="/login" className={styles.footerLink}>Corporate Audit Compliance</Link></li>
              <li><Link to="/login" className={styles.footerLink}>Security & Privacy Protocols</Link></li>
              <li><Link to="/login" className={styles.footerLink}>Terms of Enterprise Service</Link></li>
              <li><Link to="/login" className={styles.footerLink}>System Status (Online)</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div>
            © 2026 FinCore ERP Automated Engine. All rights reserved. • Engineered with full-stack precision.
          </div>
          <div className={styles.footerSocials}>
            <span>Protected by Cloudflare Zero Trust</span>
            <span>•</span>
            <span>ARM64 Linux Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

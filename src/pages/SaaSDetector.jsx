import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Activity, Sparkles, AlertTriangle, MonitorOff, ScanLine, DollarSign } from 'lucide-react';
import styles from './SaaSDetector.module.css';

export function SaaSDetector() {
  const { token } = useAuth();
  const { formatCurrency } = useSettings();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(() => {
    const saved = localStorage.getItem('fincore_saas_result');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });
  const [error, setError] = useState(null);

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const response = await fetch('/api/saas/analyze', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze SaaS leakage');
      }
      
      setResult(data);
      localStorage.setItem('fincore_saas_result', JSON.stringify(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>SaaS Leakage & Waste Detector</h1>
          <p className={styles.subtitle}>AI-powered analysis to find overlapping subscriptions and wasted spend.</p>
        </div>
        {result && (
          <Button onClick={handleScan} disabled={isScanning} icon={Sparkles}>
            Rescan Expenses
          </Button>
        )}
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-red)', borderRadius: '8px', marginBottom: '24px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {isScanning ? (
        <div className={styles.loaderContainer}>
          <div className={styles.radar} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Scanning Transaction History...</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>FinCore AI is cross-referencing your expenses to detect software overlaps.</p>
        </div>
      ) : !result ? (
        <div className={styles.emptyState}>
          <ScanLine size={64} className={styles.iconScan} />
          <h2 className={styles.emptyTitle}>Detect Wasted Subscription Spend</h2>
          <p className={styles.emptyDesc}>
            Our AI will analyze your expense history to find recurring subscriptions, 
            calculate your total monthly SaaS spend, and flag overlapping tools (e.g. paying for both QuickBooks and Xero, or multiple redundant payment processors).
          </p>
          <Button size="lg" onClick={handleScan} icon={Sparkles}>
            Run AI SaaS Audit
          </Button>
        </div>
      ) : (
        <>
          <div className={styles.summaryGrid}>
            <Card>
              <CardContent style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--color-indigo)' }}>
                  <MonitorOff size={32} />
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Detected Subscriptions</p>
                  <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-primary)' }}>{result.subscriptions.length}</h2>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--color-emerald)' }}>
                  <DollarSign size={32} />
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Monthly SaaS Spend</p>
                  <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-primary)' }}>{formatCurrency(result.totalSaaS)}</h2>
                </div>
              </CardContent>
            </Card>

            <Card style={{ borderColor: result.wastedSpend > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-light)' }}>
              <CardContent style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', background: result.wastedSpend > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: result.wastedSpend > 0 ? 'var(--color-red)' : 'var(--color-emerald)' }}>
                  {result.wastedSpend > 0 ? <AlertTriangle size={32} /> : <Activity size={32} />}
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Potential Wasted Spend</p>
                  <h2 style={{ margin: 0, fontSize: '2rem', color: result.wastedSpend > 0 ? 'var(--color-red)' : 'var(--text-primary)' }}>
                    {formatCurrency(result.wastedSpend)}
                  </h2>
                </div>
              </CardContent>
            </Card>
          </div>

          <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Detailed Breakdown</h3>
          <div className={styles.subsGrid}>
            {result.subscriptions.map((sub) => (
              <div key={sub.id} className={`${styles.subCard} ${sub.isOverlapping ? styles.subCardOverlapping : ''}`}>
                <div className={styles.subCardHeader}>
                  <h4 className={styles.subName}>{sub.name}</h4>
                  <div style={{ textAlign: 'right' }}>
                    <p className={styles.subCost}>{formatCurrency(sub.monthlyCost)}</p>
                    <span className={styles.subFreq}>/ month</span>
                  </div>
                </div>
                
                {sub.isOverlapping && (
                  <Badge variant="error" style={{ marginBottom: '16px' }}>Overlap Detected: {sub.overlappingWith}</Badge>
                )}

                <div className={`${styles.aiBox} ${sub.isOverlapping ? styles.aiBoxOverlapping : ''}`}>
                  <div className={`${styles.aiHeader} ${sub.isOverlapping ? styles.aiHeaderOverlapping : ''}`}>
                    <Sparkles size={14} /> AI Analysis
                  </div>
                  <p className={styles.aiText}>{sub.aiExplanation}</p>
                </div>
              </div>
            ))}
            
            {result.subscriptions.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No subscriptions detected in your recent transaction history.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

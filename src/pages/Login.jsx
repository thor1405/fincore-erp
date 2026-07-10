import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield } from 'lucide-react';
import styles from './Login.module.css';

export function Login() {
  const navigate = useNavigate();
  const { login, verify2FALogin } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [code2fa, setCode2fa] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (requires2FA) {
        await verify2FALogin(tempToken, code2fa);
        navigate('/');
      } else {
        const res = await login(email, password);
        if (res && res.requires2FA) {
          setRequires2FA(true);
          setTempToken(res.tempToken);
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.loginBox}>
          <Link to="/home" className={styles.logo} style={{ textDecoration: 'none' }}>
            <div className={styles.logoIcon}>FC</div>
            <span className={styles.logoText}>FinCore</span>
          </Link>
          
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Enter your details to access your account.</p>
          </div>

          <form onSubmit={handleLogin} className={styles.form}>
            {error && <div className={styles.errorAlert} style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--color-red-light)', color: '#B91C1C', fontSize: '0.9rem', fontWeight: 500 }}>{error}</div>}
            
            {!requires2FA ? (
              <>
                <Input 
                  label="Email" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className={styles.passwordGroup}>
                  <Input 
                    label="Password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <a href="#" className={styles.forgotLink}>Forgot password?</a>
                </div>
              </>
            ) : (
              <Input 
                label="2FA Verification Code" 
                type="text" 
                placeholder="Enter 6-digit code" 
                value={code2fa}
                onChange={(e) => setCode2fa(e.target.value)}
                required
                maxLength={6}
              />
            )}

            <Button type="submit" fullWidth size="lg" className={styles.submitBtn} disabled={isLoading}>
              {requires2FA ? 'Verify Code' : 'Sign in'}
            </Button>
            
            {requires2FA && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <a href="#" onClick={(e) => { e.preventDefault(); setRequires2FA(false); setTempToken(null); }} className={styles.forgotLink}>Cancel</a>
              </div>
            )}
          </form>

          <div className={styles.securityNote}>
            <Shield size={16} />
            <span>Secure 256-bit encrypted connection</span>
          </div>

          <div className={styles.signupPrompt}>
            Don't have an account? 
            <Link to="/signup" className={styles.signupLink}>Sign up</Link>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Link to="/home" style={{ fontSize: '13.5px', color: 'var(--color-indigo)', textDecoration: 'none', fontWeight: 600 }}>
              ← Return to Enterprise Homepage
            </Link>
          </div>
        </div>
      </div>
      
      <div className={styles.rightPanel}>
        <div className={styles.illustrationContent}>
          <div className={styles.heroCard}>
            <div className={styles.heroHeader}>
              <div className={styles.heroDot} />
              <div className={styles.heroDot} />
              <div className={styles.heroDot} />
            </div>
            <div className={styles.heroBody}>
              <h3 className={styles.heroTitle}>Enterprise Financial Platform</h3>
              <p className={styles.heroSubtitle}>Manage accounting, invoicing, payroll, and corporate spend all in one place.</p>
              
              <div className={styles.mockGraph}>
                <div className={styles.bar1}></div>
                <div className={styles.bar2}></div>
                <div className={styles.bar3}></div>
                <div className={styles.bar4}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

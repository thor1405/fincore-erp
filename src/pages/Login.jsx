import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield } from 'lucide-react';
import styles from './Login.module.css';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
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
          <div className={styles.logo}>
            <div className={styles.logoIcon}>FC</div>
            <span className={styles.logoText}>FinCore</span>
          </div>
          
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Enter your details to access your account.</p>
          </div>

          <form onSubmit={handleLogin} className={styles.form}>
            {error && <div className={styles.errorAlert} style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--color-red-light)', color: '#B91C1C', fontSize: '0.9rem', fontWeight: 500 }}>{error}</div>}
            
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

            <Button type="submit" fullWidth size="lg" className={styles.submitBtn}>
              Sign in
            </Button>
          </form>

          <div className={styles.securityNote}>
            <Shield size={16} />
            <span>Secure 256-bit encrypted connection</span>
          </div>

          <div className={styles.signupPrompt}>
            Don't have an account? 
            <Link to="/signup" className={styles.signupLink}>Sign up</Link>
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

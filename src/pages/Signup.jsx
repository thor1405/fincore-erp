import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield } from 'lucide-react';
import styles from './Signup.module.css';

export function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create account');
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
            <h1 className={styles.title}>Create an account</h1>
            <p className={styles.subtitle}>Start managing your finances like a pro.</p>
          </div>

          <form onSubmit={handleSignup} className={styles.form}>
            {error && <div className={styles.errorAlert}>{error}</div>}
            
            <Input 
              label="Full Name" 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input 
              label="Email" 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="Create a strong password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            <Button type="submit" fullWidth size="lg" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className={styles.switchText}>
            Already have an account? <Link to="/login" className={styles.link}>Sign in</Link>
          </p>

          <div className={styles.securityNote}>
            <Shield size={16} />
            <span>Secure 256-bit encrypted connection</span>
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
              <h3 className={styles.heroTitle}>Join FinCore ERP</h3>
              <p className={styles.heroSubtitle}>Enterprise-grade financial tools built for speed, accuracy, and scale.</p>
              
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

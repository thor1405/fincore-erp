import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Button } from '../components/ui/Button';
import { Plus, Target, Trash2, Edit2, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BudgetModal } from '../components/BudgetModal';
import styles from './Budgets.module.css';

export function Budgets() {
  const { token } = useAuth();
  const { formatCurrency } = useSettings();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBudgets(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget limit?')) return;
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchBudgets();
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const getStatusColor = (spent, amount) => {
    const percentage = (spent / amount) * 100;
    if (percentage >= 100) return 'var(--color-red)';
    if (percentage >= 85) return 'var(--color-amber)';
    return 'var(--color-emerald)';
  };

  const getStatusIcon = (spent, amount) => {
    const percentage = (spent / amount) * 100;
    if (percentage >= 100) return <AlertCircle size={20} color="var(--color-red)" />;
    if (percentage >= 85) return <TrendingUp size={20} color="var(--color-amber)" />;
    return <CheckCircle2 size={20} color="var(--color-emerald)" />;
  };

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Budget Limits</h1>
          <p className={styles.subtitle}>Set monthly limits and track your spending in real-time.</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditingBudget(null); setIsModalOpen(true); }}>
          New Budget
        </Button>
      </div>

      {loading ? (
        <div>Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className={styles.emptyState}>
          <Target size={48} className={styles.emptyIcon} />
          <h3>No Budgets Set</h3>
          <p>Create your first budget limit to start tracking expenses.</p>
          <Button onClick={() => setIsModalOpen(true)}>Create Budget</Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {budgets.map(budget => {
            const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
            const remaining = budget.amount - budget.spent;
            const color = getStatusColor(budget.spent, budget.amount);

            return (
              <div key={budget.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    {getStatusIcon(budget.spent, budget.amount)}
                    <h3>{budget.category}</h3>
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.actionBtn} onClick={() => { setEditingBudget(budget); setIsModalOpen(true); }}>
                      <Edit2 size={16} />
                    </button>
                    <button className={styles.actionBtn} onClick={() => handleDelete(budget.id)} style={{ color: 'var(--color-red)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.stats}>
                  <div className={styles.statGroup}>
                    <span className={styles.statLabel}>Spent</span>
                    <span className={styles.statValue}>{formatCurrency(budget.spent)}</span>
                  </div>
                  <div className={styles.statGroup} style={{ textAlign: 'right' }}>
                    <span className={styles.statLabel}>Limit</span>
                    <span className={styles.statValue}>{formatCurrency(budget.amount)}</span>
                  </div>
                </div>

                <div className={styles.progressContainer}>
                  <div 
                    className={styles.progressBar} 
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                  />
                </div>

                <div className={styles.footer}>
                  <span style={{ color }}>{percentage.toFixed(1)}% Used</span>
                  <span>{remaining > 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <BudgetModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchBudgets}
          initialData={editingBudget}
        />
      )}
    </div>
  );
}

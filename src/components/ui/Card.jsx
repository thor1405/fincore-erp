import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

export function Card({ children, className, noPadding = false, ...props }) {
  return (
    <div className={clsx(styles.card, noPadding && styles.noPadding, className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className, ...props }) {
  return (
    <div className={clsx(styles.header, className)} {...props}>
      <div className={styles.headerContent}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export function CardContent({ children, className, ...props }) {
  return <div className={clsx(styles.content, className)} {...props}>{children}</div>;
}

import React from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  icon: Icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className
      )}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className={styles.icon} />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className={styles.icon} />}
    </button>
  );
});

Button.displayName = 'Button';

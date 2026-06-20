import React from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

export const Input = React.forwardRef(({
  label,
  error,
  icon: Icon,
  fullWidth = true,
  className,
  containerClassName,
  ...props
}, ref) => {
  return (
    <div className={clsx(styles.container, fullWidth && styles.fullWidth, containerClassName)}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper}>
        {Icon && <Icon size={18} className={styles.icon} />}
        <input
          ref={ref}
          className={clsx(
            styles.input,
            Icon && styles.withIcon,
            error && styles.errorInput,
            className
          )}
          {...props}
        />
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

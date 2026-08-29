import React from 'react';

/**
 * Reusable Button component.
 *
 * Props:
 *  - variant: 'primary' | 'secondary' | 'ghost'   (default: 'primary')
 *  - size:    'sm' | 'md' | 'lg'                  (default: 'md')
 *  - fullWidth: boolean                            (default: false)
 *  - disabled: boolean
 *  - loading: boolean — shows spinner, disables click
 *  - onClick, type, children — standard button props
 */

const styles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'inherit',
    fontWeight: '600',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.18s ease, box-shadow 0.18s ease, transform 0.12s ease',
    outline: 'none',
    textDecoration: 'none',
  },

  variants: {
    primary: {
      background: 'var(--primary)',
      color: '#FFFFFF',
    },
    secondary: {
      background: 'var(--bg-surface-alt)',
      color: 'var(--text-heading)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--primary)',
    },
  },

  sizes: {
    sm: { padding: '8px 16px',  fontSize: '13px', height: '36px' },
    md: { padding: '12px 20px', fontSize: '14px', height: '44px' },
    lg: { padding: '14px 24px', fontSize: '15px', height: '50px' },
  },
};

const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  children,
  style = {},
}) => {
  const isDisabled = disabled || loading;

  const computedStyle = {
    ...styles.base,
    ...styles.variants[variant],
    ...styles.sizes[size],
    width: fullWidth ? '100%' : 'auto',
    opacity: isDisabled ? 0.6 : 1,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    ...style,
  };

  return (
    <button
      type={type}
      style={computedStyle}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          if (variant === 'primary') e.currentTarget.style.background = 'var(--primary-dark)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          if (variant === 'primary') e.currentTarget.style.background = 'var(--primary)';
          if (variant === 'secondary') e.currentTarget.style.background = 'var(--bg-surface-alt)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {loading && (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid rgba(255,255,255,0.4)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </button>
  );
};

export default Button;

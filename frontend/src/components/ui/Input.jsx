import React, { useState } from 'react';

/**
 * Reusable Input component.
 *
 * Props:
 *  - label:       string — field label above the input
 *  - type:        'text' | 'email' | 'password' (default: 'text')
 *  - placeholder: string
 *  - value:       string
 *  - onChange:    function
 *  - error:       string — red error message below input
 *  - disabled:    boolean
 *  - id:          string — links label to input (accessibility)
 */

// Eye icon SVGs — inline so no icon library needed
const EyeOpenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  id,
  style = {},
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  // If it's a password field, toggle between text/password
  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  const inputWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyle = {
    width: '100%',
    height: '44px',
    padding: '0 44px 0 14px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: 'var(--text-heading)',
    background: 'var(--bg-surface)',
    border: `1.5px solid ${error ? 'var(--error)' : focused ? 'var(--border-focus)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
    boxShadow: focused ? '0 0 0 3px rgba(79, 70, 229, 0.12)' : 'none',
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? 0.6 : 1,
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-heading)',
    marginBottom: '6px',
  };

  const toggleBtnStyle = {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    padding: '0',
    lineHeight: 1,
  };

  const errorStyle = {
    fontSize: '12px',
    color: 'var(--error)',
    marginTop: '5px',
  };

  return (
    <div style={{ width: '100%', ...style }}>
      {/* Label */}
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div style={inputWrapperStyle}>
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {/* Password toggle button */}
        {type === 'password' && (
          <button
            type="button"
            style={toggleBtnStyle}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
};

export default Input;

import React, { useState } from 'react';
import { Icon } from '@iconify/react';

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

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  id,
  icon,
  className = '',
  style = {},
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
    paddingLeft: icon ? '38px' : '14px',
    paddingRight: type === 'password' ? '42px' : '14px',
    fontSize: '13.5px',
    fontFamily: 'inherit',
    color: '#0F172A',
    background: focused ? '#FFFFFF' : isHovered ? '#F8FAFC' : '#FFFFFF',
    border: `1px solid ${error ? '#EF4444' : focused ? '#4F46E5' : isHovered ? '#CBD5E1' : '#E2E8F0'}`,
    borderRadius: '11px',
    outline: 'none',
    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: focused 
      ? '0 0 0 3.5px rgba(79, 70, 229, 0.12), 0 1px 2px rgba(0, 0, 0, 0.05)' 
      : '0 1px 2px rgba(0, 0, 0, 0.02)',
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? 0.6 : 1,
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px',
  };

  const toggleBtnStyle = {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94A3B8',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    lineHeight: 1,
    borderRadius: '6px',
    transition: 'color 0.15s ease',
  };

  const errorStyle = {
    fontSize: '12px',
    fontWeight: '500',
    color: '#EF4444',
    marginTop: '5px',
  };

  return (
    <div className={`input-field-group ${className}`} style={{ width: '100%', ...style }}>
      {/* Label */}
      {label && (
        <label htmlFor={id} className="input-field-label" style={labelStyle}>
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div style={inputWrapperStyle}>
        {/* Leading icon if provided */}
        {icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: focused ? '#4F46E5' : isHovered ? '#64748B' : '#94A3B8',
            pointerEvents: 'none',
            transition: 'color 0.18s ease',
          }}>
            <Icon icon={icon} width="17" height="17" />
          </div>
        )}

        <input
          id={id}
          className="input-field-input"
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
            <Icon 
              icon={showPassword ? 'lucide:eye' : 'lucide:eye-off'} 
              width="18" 
              height="18" 
            />
          </button>
        )}
      </div>

      {/* Error message */}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
};

export default Input;

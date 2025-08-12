import React, { useState } from 'react';
import Input from './Input';
import Button from './Button';

/**
 * PasswordInput Component
 * A password input field with show/hide functionality
 */
export default function PasswordInput({ 
  name, 
  value, 
  onChange, 
  placeholder = "Password", 
  error, 
  autoComplete = "current-password",
  className = "",
  ...props 
}) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };



  return (
    <Input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={showPassword ? "text" : "password"}
      error={error}
      autoComplete={autoComplete}
      className={className}
      suffix={
        <Button
          type="button"
          onClick={togglePasswordVisibility}
          isPasswordToggle={true}
          showPassword={showPassword}
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        />
      }
      {...props}
    />
  );
} 
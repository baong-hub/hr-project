import React, { useState, useEffect } from 'react';
import styles from './MoneyInput.module.scss';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
  suffix?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
  min,
  max,
  className = '',
  suffix = '₫'
}) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(new Intl.NumberFormat('vi-VN').format(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '').replace(/,/g, '');
    if (rawValue === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const numericValue = parseInt(rawValue, 10);
    if (isNaN(numericValue)) return;

    let finalValue = numericValue;
    if (min !== undefined && finalValue < min) finalValue = min;
    if (max !== undefined && finalValue > max) finalValue = max;

    setDisplayValue(new Intl.NumberFormat('vi-VN').format(finalValue));
    onChange(finalValue);
  };

  return (
    <div className={`${styles.moneyInputWrapper} ${className}`}>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={styles.moneyInput}
      />
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </div>
  );
};

import React from 'react';

interface MoneyDisplayProps {
  value: number;
  currency?: string;
  className?: string;
  color?: 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'default';
  showSign?: boolean;
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({ 
  value, 
  currency = '₫', 
  className = '', 
  color = 'default',
  showSign = false
}) => {
  const formattedValue = new Intl.NumberFormat('vi-VN').format(Math.abs(value));
  const sign = showSign && value !== 0 ? (value > 0 ? '+' : '−') : '';
  
  const colorClass = color !== 'default' ? `text-${color}` : '';
  
  return (
    <span className={`${colorClass} ${className}`} style={{ fontWeight: 500 }}>
      {sign}{formattedValue} {currency}
    </span>
  );
};

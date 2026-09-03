/**
 * Global Formatters Utility for CRM Application.
 * Reads format settings dynamically from localStorage ('systemConfigs').
 */

export interface SystemConfigs {
  'system.timezone'?: string;
  'system.date_format'?: string;
  'system.datetime_format'?: string;
  'system.time_format'?: string;
  'system.thousands_separator'?: string;
  'system.decimal_separator'?: string;
  [key: string]: string | undefined;
}

export function getSystemConfigs(): SystemConfigs {
  try {
    const raw = localStorage.getItem('systemConfigs');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse error
  }
  return {
    'system.timezone': 'Asia/Ho_Chi_Minh',
    'system.date_format': 'DD/MM/YYYY',
    'system.datetime_format': 'DD/MM/YYYY HH:mm',
    'system.time_format': 'HH:mm',
    'system.thousands_separator': '.',
    'system.decimal_separator': ',',
  };
}

/**
 * Format date value according to system.date_format in localStorage (default DD/MM/YYYY)
 */
export function formatDate(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());

  const configs = getSystemConfigs();
  const format = configs['system.date_format'] || 'DD/MM/YYYY';

  if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  // Default DD/MM/YYYY
  return `${day}/${month}/${year}`;
}

/**
 * Format datetime value according to system.datetime_format in localStorage (default DD/MM/YYYY HH:mm)
 */
export function formatDateTime(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const configs = getSystemConfigs();
  const dateStr = formatDate(date);
  const timeFormat = configs['system.time_format'] || 'HH:mm';
  const timeStr = timeFormat === 'HH:mm' ? `${hours}:${minutes}` : `${hours}:${minutes}`;

  return `${dateStr} ${timeStr}`;
}

/**
 * Format numeric value according to system.thousands_separator and system.decimal_separator in localStorage
 */
export function formatNumber(
  value?: number | string | null,
  decimals: number = 0
): string {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';

  const configs = getSystemConfigs();
  const thousandsSep = configs['system.thousands_separator'] ?? '.';
  const decimalSep = configs['system.decimal_separator'] ?? ',';

  const parts = num.toFixed(decimals).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
  
  if (decimals > 0 && parts[1]) {
    return `${integerPart}${decimalSep}${parts[1]}`;
  }
  return integerPart;
}

/**
 * Format currency amount (e.g. 1.000.000 đ)
 */
export function formatMoney(amount?: number | string | null): string {
  return `${formatNumber(amount, 0)} đ`;
}

/**
 * Format currency amount with symbol (e.g. 1.000.000 VND)
 */
export function formatCurrency(amount?: number | string | null, currencySymbol: string = 'VND'): string {
  return `${formatNumber(amount, 0)} ${currencySymbol}`;
}

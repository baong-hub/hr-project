import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './DatePresetSelect.module.scss';

export interface DatePresetOption {
  key: string;
  label: string;
}

export const PRESET_OPTIONS: DatePresetOption[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'yesterday', label: 'Hôm qua' },
  { key: 'thisWeek', label: 'Tuần này' },
  { key: 'lastWeek', label: 'Tuần trước' },
  { key: 'thisMonth', label: 'Tháng này' },
  { key: 'lastMonth', label: 'Tháng trước' },
  { key: 'thisQuarter', label: 'Quý này' },
  { key: 'lastQuarter', label: 'Quý trước' },
  { key: 'thisYear', label: 'Năm nay' },
  { key: 'custom', label: 'Thời gian khác' },
];

export const formatDateLocal = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getPresetRange = (key: string): { startDate: string; endDate: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (key) {
    case 'today': {
      const dateStr = formatDateLocal(today);
      return { startDate: dateStr, endDate: dateStr };
    }
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      const dateStr = formatDateLocal(y);
      return { startDate: dateStr, endDate: dateStr };
    }
    case 'thisWeek': {
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { startDate: formatDateLocal(monday), endDate: formatDateLocal(sunday) };
    }
    case 'lastWeek': {
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const mondayThisWeek = new Date(today);
      mondayThisWeek.setDate(today.getDate() + diffToMonday);
      const mondayLastWeek = new Date(mondayThisWeek);
      mondayLastWeek.setDate(mondayThisWeek.getDate() - 7);
      const sundayLastWeek = new Date(mondayLastWeek);
      sundayLastWeek.setDate(mondayLastWeek.getDate() + 6);
      return { startDate: formatDateLocal(mondayLastWeek), endDate: formatDateLocal(sundayLastWeek) };
    }
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { startDate: formatDateLocal(start), endDate: formatDateLocal(end) };
    }
    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: formatDateLocal(start), endDate: formatDateLocal(end) };
    }
    case 'thisYear': {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      return { startDate: formatDateLocal(start), endDate: formatDateLocal(end) };
    }
    case 'thisQuarter': {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
      const start = new Date(today.getFullYear(), quarterStartMonth, 1);
      const end = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
      return { startDate: formatDateLocal(start), endDate: formatDateLocal(end) };
    }
    case 'lastQuarter': {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3 - 3;
      const start = new Date(today.getFullYear(), quarterStartMonth, 1);
      const end = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
      return { startDate: formatDateLocal(start), endDate: formatDateLocal(end) };
    }
    case 'all':
    default: {
      return { startDate: '', endDate: '' };
    }
  }
};

export const detectPresetKey = (startDate: string, endDate: string): string => {
  if (!startDate && !endDate) return 'all';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateLocal(today);
  const firstOfMonthStr = formatDateLocal(new Date(today.getFullYear(), today.getMonth(), 1));
  const endOfMonthStr = formatDateLocal(new Date(today.getFullYear(), today.getMonth() + 1, 0));

  if (startDate === firstOfMonthStr && (endDate === todayStr || endDate === endOfMonthStr)) {
    return 'thisMonth';
  }

  for (const opt of PRESET_OPTIONS) {
    if (opt.key === 'custom' || opt.key === 'all') continue;
    const range = getPresetRange(opt.key);
    if (range.startDate === startDate && range.endDate === endDate) {
      return opt.key;
    }
  }
  return 'custom';
};

export interface DatePresetSelectProps {
  label?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (startDate: string, endDate: string, presetKey: string) => void;
  onSearch?: () => void;
  className?: string;
}

export const DatePresetSelect: React.FC<DatePresetSelectProps> = ({
  label,
  startDate,
  endDate,
  onChange,
  onSearch,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string>(() => detectPresetKey(startDate, endDate));
  const [viewMode, setViewMode] = useState<'list' | 'custom'>('list');
  const [tempStart, setTempStart] = useState<string>(startDate);
  const [tempEnd, setTempEnd] = useState<string>(endDate);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanStart = startDate ? startDate.split('T')[0] : '';
    const cleanEnd = endDate ? endDate.split('T')[0] : '';
    setActivePreset(detectPresetKey(cleanStart, cleanEnd));
    setTempStart(cleanStart);
    setTempEnd(cleanEnd);
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode('list');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleTrigger = () => {
    if (!isOpen) {
      setIsOpen(true);
      setViewMode('list');
    } else {
      setIsOpen(false);
      setViewMode('list');
    }
  };

  const handleSelectPreset = (key: string) => {
    if (key === 'custom') {
      setActivePreset('custom');
      setViewMode('custom');
      return;
    }

    const range = getPresetRange(key);
    setActivePreset(key);
    setTempStart(range.startDate);
    setTempEnd(range.endDate);
    setIsOpen(false);
    setViewMode('list');

    onChange(range.startDate, range.endDate, key);
    if (onSearch) {
      onSearch();
    }
  };

  const handleApplyCustom = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();

    let s = tempStart ? tempStart.split('T')[0] : '';
    let eDate = tempEnd ? tempEnd.split('T')[0] : '';

    if (s && eDate && s > eDate) {
      const swap = s;
      s = eDate;
      eDate = swap;
    }

    setActivePreset('custom');
    setIsOpen(false);
    setViewMode('list');

    onChange(s, eDate, 'custom');
    if (onSearch) {
      onSearch();
    }
  };

  const handleCloseCustom = () => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setIsOpen(false);
    setViewMode('list');
  };

  const getDisplayLabel = () => {
    const opt = PRESET_OPTIONS.find((o) => o.key === activePreset);
    return opt ? opt.label : 'Thời gian khác';
  };

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      
      <div
        className={`${styles.trigger} ${isOpen ? styles.active : ''}`}
        onClick={handleToggleTrigger}
      >
        <span className={styles.triggerText}>{getDisplayLabel()}</span>
        <ChevronDown size={16} className={`${styles.triggerIcon} ${isOpen ? styles.rotated : ''}`} />
      </div>

      {isOpen && (
        <div className={styles.popover}>
          {viewMode === 'list' ? (
            <div className={styles.optionsList}>
              {PRESET_OPTIONS.map((opt) => {
                const isSelected = activePreset === opt.key;
                return (
                  <div
                    key={opt.key}
                    className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleSelectPreset(opt.key)}
                  >
                    {opt.label}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.customForm}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Ngày bắt đầu</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className={styles.dateInput}
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Ngày kết thúc</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className={styles.dateInput}
                  required
                />
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={styles.btnClose}
                  onClick={handleCloseCustom}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className={styles.btnSearch}
                  onClick={handleApplyCustom}
                >
                  Tìm kiếm
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePresetSelect;

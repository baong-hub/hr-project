import React, { useState, useRef, useEffect, useMemo } from 'react';
import styles from './DateRangePicker.module.scss';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DateRangePickerProps {
  label?: string;
  startDate: string; // ISO string or YYYY-MM-DD
  endDate: string;   // ISO string or YYYY-MM-DD
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  placeholder?: string;
}

type Preset = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom';

const parseDateLocal = (dStr: string): Date | null => {
  if (!dStr) return null;
  if (dStr.includes('-') && !dStr.includes('T')) {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
  }
  const d = new Date(dStr);
  return isNaN(d.getTime()) ? null : d;
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  placeholder = 'Chọn khoảng thời gian',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<Preset>('custom');
  const [tempStart, setTempStart] = useState<Date | null>(parseDateLocal(startDate));
  const [tempEnd, setTempEnd] = useState<Date | null>(parseDateLocal(endDate));
  const [viewDate, setViewDate] = useState<Date>(new Date());
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync temp state with props when opening or when props change and popover is closed
  useEffect(() => {
    if (!isOpen) {
      setTempStart(parseDateLocal(startDate));
      setTempEnd(parseDateLocal(endDate));
    }
  }, [startDate, endDate, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) return '';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const toISODate = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onStartDateChange(toISODate(tempStart));
      onEndDateChange(toISODate(tempEnd));
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    onStartDateChange('');
    onEndDateChange('');
    setActivePreset('custom');
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStart(parseDateLocal(startDate));
    setTempEnd(parseDateLocal(endDate));
    setIsOpen(false);
  };

  const setPreset = (preset: Preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = new Date(today);
    let end = new Date(today);

    switch (preset) {
      case 'today':
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'last7':
        start.setDate(today.getDate() - 6);
        break;
      case 'last30':
        start.setDate(today.getDate() - 29);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }

    setTempStart(start);
    setTempEnd(end);
    setActivePreset(preset);
    setViewDate(start);
  };

  const renderCalendar = (monthOffset: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth() + monthOffset, 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, current: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, current: true, date: new Date(year, month, i) });
    }
    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
    }

    return (
      <div className={styles.calendar}>
        <div className={styles.calendarHeader}>
          {monthOffset === 0 && (
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))}><ChevronLeft size={18} /></button>
          )}
          <span>{monthName}</span>
          {monthOffset === 1 && (
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))}><ChevronRight size={18} /></button>
          )}
        </div>
        <div className={styles.weekdays}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}
        </div>
        <div className={styles.days}>
          {days.map((d, i) => {
            const isSelected = (tempStart && d.date.getTime() === tempStart.getTime()) || 
                             (tempEnd && d.date.getTime() === tempEnd.getTime());
            const isInRange = tempStart && tempEnd && d.date > tempStart && d.date < tempEnd;
            const isStart = tempStart && d.date.getTime() === tempStart.getTime();
            const isEnd = tempEnd && d.date.getTime() === tempEnd.getTime();

            return (
              <div 
                key={i} 
                className={`
                  ${styles.day} 
                  ${!d.current ? styles.notCurrent : ''} 
                  ${isSelected ? styles.selected : ''} 
                  ${isInRange ? styles.inRange : ''}
                  ${isStart ? styles.rangeStart : ''}
                  ${isEnd ? styles.rangeEnd : ''}
                `}
                onClick={() => {
                  if (!tempStart || (tempStart && tempEnd)) {
                    setTempStart(d.date);
                    setTempEnd(null);
                    setActivePreset('custom');
                  } else if (d.date < tempStart) {
                    setTempStart(d.date);
                    setTempEnd(null);
                  } else {
                    setTempEnd(d.date);
                  }
                }}
              >
                {d.day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const displayText = useMemo(() => {
    if (startDate && endDate) {
      const s = parseDateLocal(startDate);
      const e = parseDateLocal(endDate);
      if (s && e) {
        return `${formatDate(s)} - ${formatDate(e)}`;
      }
    }
    return ""; // Show empty if no range selected
  }, [startDate, endDate]);

  return (
    <div className={styles.container} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper} onClick={() => setIsOpen(!isOpen)}>
        <input 
          readOnly 
          value={displayText} 
          placeholder={placeholder}
          className={styles.mainInput}
        />
        {startDate && endDate && (
          <X 
            size={16} 
            className={styles.clearIcon} 
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }} 
          />
        )}
        <CalendarIcon size={18} className={styles.calendarIcon} />
      </div>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.sidebar}>
            <div className={`${styles.presetItem} ${activePreset === 'today' ? styles.active : ''}`} onClick={() => setPreset('today')}>Hôm nay</div>
            <div className={`${styles.presetItem} ${activePreset === 'yesterday' ? styles.active : ''}`} onClick={() => setPreset('yesterday')}>Hôm qua</div>
            <div className={`${styles.presetItem} ${activePreset === 'last7' ? styles.active : ''}`} onClick={() => setPreset('last7')}>7 ngày qua</div>
            <div className={`${styles.presetItem} ${activePreset === 'last30' ? styles.active : ''}`} onClick={() => setPreset('last30')}>30 ngày qua</div>
            <div className={`${styles.presetItem} ${activePreset === 'thisMonth' ? styles.active : ''}`} onClick={() => setPreset('thisMonth')}>Tháng này</div>
            <div className={`${styles.presetItem} ${activePreset === 'lastMonth' ? styles.active : ''}`} onClick={() => setPreset('lastMonth')}>Tháng trước</div>
            <div className={`${styles.presetItem} ${activePreset === 'thisYear' ? styles.active : ''}`} onClick={() => setPreset('thisYear')}>Năm nay</div>
            <div className={`${styles.presetItem} ${activePreset === 'lastYear' ? styles.active : ''}`} onClick={() => setPreset('lastYear')}>Năm trước</div>
            <div className={`${styles.presetItem} ${activePreset === 'custom' ? styles.active : ''}`} onClick={() => setActivePreset('custom')}>Tuỳ chọn</div>
          </div>
          
          <div className={styles.content}>
            <div className={styles.calendars}>
              {renderCalendar(0)}
              {renderCalendar(1)}
            </div>
            
            <div className={styles.footer}>
              <div className={styles.selectedRange}>
                {tempStart && formatDate(tempStart)} {tempEnd && ` - ${formatDate(tempEnd)}`}
              </div>
              <div className={styles.footerActions}>
                <button className={styles.clearBtn} onClick={() => { setTempStart(null); setTempEnd(null); setActivePreset('custom'); }}>Xoá chọn</button>
                <button className={styles.cancelBtn} onClick={handleCancel}>Huỷ</button>
                <button className={styles.applyBtn} onClick={handleApply}>Áp dụng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

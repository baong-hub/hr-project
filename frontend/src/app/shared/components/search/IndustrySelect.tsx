import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, ChevronDown, X, Check } from 'lucide-react';
import {
  metaService,
  type IndustryItem,
  STATIC_INDUSTRIES,
  normalizeText
} from '../../../core/services/meta.service';
import styles from './SearchBar.module.scss';

export interface IndustrySelectProps {
  value?: string | string[];
  onChange?: (selected: any, item?: any) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  inlineDisplay?: boolean;
  id?: string;
}

export const IndustrySelect: React.FC<IndustrySelectProps> = ({
  value,
  onChange,
  multiple = false,
  placeholder = 'Chọn ngành nghề...',
  className = '',
  disabled = false,
  inlineDisplay = false,
  id
}) => {
  const [industries, setIndustries] = useState<IndustryItem[]>(STATIC_INDUSTRIES);
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    metaService.getIndustries().then((data) => {
      if (data && data.length > 0) setIndustries(data);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectedList: string[] = Array.isArray(value)
    ? value
    : value
    ? [value]
    : [];

  const filteredIndustries = industries.filter((ind) => {
    if (!filterText.trim()) return true;
    return normalizeText(ind.name).includes(normalizeText(filterText));
  });

  const handleSelect = (ind: IndustryItem) => {
    if (multiple) {
      const next = selectedList.includes(ind.code)
        ? selectedList.filter((c) => c !== ind.code)
        : [...selectedList, ind.code];
      const items = industries.filter((i) => next.includes(i.code));
      onChange?.(next, items);
    } else {
      onChange?.(ind.code, ind);
      setIsOpen(false);
    }
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (multiple) {
      onChange?.([], []);
    } else {
      onChange?.('', null);
    }
  };

  const getLabel = () => {
    if (selectedList.length === 0) return placeholder;
    if (multiple) {
      if (selectedList.length === 1) {
        const found = industries.find((i) => i.code === selectedList[0]);
        return found ? found.name : '1 ngành nghề';
      }
      return `${selectedList.length} ngành nghề`;
    }
    const found = industries.find((i) => i.code === selectedList[0] || i.name === selectedList[0]);
    return found ? found.name : selectedList[0];
  };

  const hasSelection = selectedList.length > 0 && selectedList[0] !== '';

  return (
    <div
      ref={containerRef}
      id={id}
      className={`${styles.inputGroup} ${inlineDisplay ? styles.formInputGroup : ''} ${className}`}
      style={inlineDisplay ? { width: '100%' } : undefined}
    >
      <Briefcase size={18} className={styles.inputIcon} />
      <button
        type="button"
        className={styles.dropdownTrigger}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
      >
        <span className={!hasSelection ? styles.dropdownTriggerPlaceholder : ''}>
          {getLabel()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {hasSelection && !disabled && (
            <span
              role="button"
              tabIndex={0}
              className={styles.clearBtn}
              onClick={handleClear}
              title="Xóa lựa chọn"
              style={{ display: 'inline-flex', padding: '2px' }}
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown size={15} style={{ color: 'var(--color-text-muted)' }} />
        </div>
      </button>

      {isOpen && (
        <div
          className={styles.popoverDropdown}
          role="dialog"
          aria-label="Bảng chọn ngành nghề"
          style={inlineDisplay ? { width: '100%', minWidth: '320px' } : undefined}
        >
          <input
            type="text"
            className={styles.filterSearchInput}
            placeholder="Lọc nhanh ngành nghề..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            autoFocus
          />

          <div className={styles.popoverContent}>
            <div className={styles.optionsGrid}>
              {filteredIndustries.map((ind) => {
                const isSelected = selectedList.includes(ind.code) || selectedList.includes(ind.name);
                return (
                  <label
                    key={ind.code}
                    className={`${styles.optionLabel} ${isSelected ? styles.optionActive : ''}`}
                    onClick={(e) => {
                      if (!multiple) {
                        e.preventDefault();
                        handleSelect(ind);
                      }
                    }}
                  >
                    {multiple ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelect(ind)}
                      />
                    ) : (
                      isSelected && <Check size={14} style={{ color: 'var(--color-primary)' }} />
                    )}
                    <span>{ind.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {multiple && (
            <div className={styles.popoverFooter}>
              <button
                type="button"
                className={styles.clearBtn}
                onClick={handleClear}
              >
                Bỏ chọn tất cả
              </button>
              <button
                type="button"
                className={styles.doneBtn}
                onClick={() => setIsOpen(false)}
              >
                Đóng ({selectedList.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default IndustrySelect;

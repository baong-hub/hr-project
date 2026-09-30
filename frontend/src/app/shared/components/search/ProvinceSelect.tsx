import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, X, Check } from 'lucide-react';
import {
  metaService,
  type ProvinceItem,
  STATIC_PROVINCES,
  normalizeText
} from '../../../core/services/meta.service';
import styles from './SearchBar.module.scss';

export interface ProvinceSelectProps {
  value?: string | string[];
  onChange?: (selected: any, item?: any) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  inlineDisplay?: boolean;
  includeRemote?: boolean;
  isRemote?: boolean;
  onRemoteChange?: (isRemote: boolean) => void;
  id?: string;
}

export const ProvinceSelect: React.FC<ProvinceSelectProps> = ({
  value,
  onChange,
  multiple = false,
  placeholder = 'Chọn địa điểm / tỉnh thành...',
  className = '',
  disabled = false,
  inlineDisplay = false,
  includeRemote = false,
  isRemote = false,
  onRemoteChange,
  id
}) => {
  const [provinces, setProvinces] = useState<ProvinceItem[]>(STATIC_PROVINCES);
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    metaService.getProvinces().then((data) => {
      if (data && data.length > 0) setProvinces(data);
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

  const filteredProvinces = provinces.filter((p) => {
    if (!filterText.trim()) return true;
    const query = normalizeText(filterText);
    const inName = normalizeText(p.name).includes(query);
    const inAliases = p.aliases.some((a) => normalizeText(a).includes(query));
    const inLegacy = p.legacyNames.some((l) => normalizeText(l).includes(query));
    return inName || inAliases || inLegacy;
  });

  const handleSelect = (p: ProvinceItem) => {
    if (multiple) {
      const next = selectedList.includes(p.code)
        ? selectedList.filter((c) => c !== p.code)
        : [...selectedList, p.code];
      const items = provinces.filter((prov) => next.includes(prov.code));
      onChange?.(next, items);
    } else {
      onChange?.(p.code, p);
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
    if (multiple) {
      const parts: string[] = [];
      if (selectedList.length === 1) {
        const found = provinces.find((p) => p.code === selectedList[0]);
        if (found) parts.push(found.name);
      } else if (selectedList.length > 1) {
        parts.push(`${selectedList.length} địa điểm`);
      }
      if (isRemote) parts.push('Từ xa');
      if (parts.length === 0) return placeholder;
      return parts.join(' + ');
    }

    if (selectedList.length === 0) return placeholder;
    const found = provinces.find((p) => p.code === selectedList[0] || p.name === selectedList[0]);
    return found ? found.name : selectedList[0];
  };

  const hasSelection = (selectedList.length > 0 && selectedList[0] !== '') || (includeRemote && isRemote);

  const cityProvinces = filteredProvinces.filter((p) => p.type === 'city');
  const normalProvinces = filteredProvinces.filter((p) => p.type === 'province');

  return (
    <div
      ref={containerRef}
      id={id}
      className={`${styles.inputGroup} ${inlineDisplay ? styles.formInputGroup : ''} ${className}`}
      style={inlineDisplay ? { width: '100%' } : undefined}
    >
      <MapPin size={18} className={styles.inputIcon} />
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
          aria-label="Bảng chọn địa điểm"
          style={inlineDisplay ? { width: '100%', minWidth: '320px' } : undefined}
        >
          <input
            type="text"
            className={styles.filterSearchInput}
            placeholder="Tìm tỉnh/thành (gõ 'Bình Dương' ra TP.HCM)..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            autoFocus
          />

          <div className={styles.popoverContent}>
            {includeRemote && (
              <label className={styles.optionLabel}>
                <input
                  type="checkbox"
                  checked={isRemote}
                  onChange={(e) => onRemoteChange?.(e.target.checked)}
                />
                <strong>Làm việc từ xa (Remote)</strong>
              </label>
            )}

            {cityProvinces.length > 0 && (
              <div>
                <div className={styles.sectionTitle}>
                  Thành phố trực thuộc TW ({cityProvinces.length})
                </div>
                <div className={styles.optionsGrid}>
                  {cityProvinces.map((p) => {
                    const isSelected = selectedList.includes(p.code) || selectedList.includes(p.name);
                    return (
                      <label
                        key={p.code}
                        className={`${styles.optionLabel} ${isSelected ? styles.optionActive : ''}`}
                        onClick={(e) => {
                          if (!multiple) {
                            e.preventDefault();
                            handleSelect(p);
                          }
                        }}
                      >
                        {multiple ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelect(p)}
                          />
                        ) : (
                          isSelected && <Check size={14} style={{ color: 'var(--color-primary)' }} />
                        )}
                        <div>
                          <span>{p.name}</span>
                          {p.legacyNames && p.legacyNames.length > 0 && (
                            <span className={styles.legacyNote}>
                              (gồm {p.legacyNames.slice(0, 2).join(', ')})
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {normalProvinces.length > 0 && (
              <div>
                <div className={styles.sectionTitle}>
                  Tỉnh ({normalProvinces.length})
                </div>
                <div className={styles.optionsGrid}>
                  {normalProvinces.map((p) => {
                    const isSelected = selectedList.includes(p.code) || selectedList.includes(p.name);
                    return (
                      <label
                        key={p.code}
                        className={`${styles.optionLabel} ${isSelected ? styles.optionActive : ''}`}
                        onClick={(e) => {
                          if (!multiple) {
                            e.preventDefault();
                            handleSelect(p);
                          }
                        }}
                      >
                        {multiple ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelect(p)}
                          />
                        ) : (
                          isSelected && <Check size={14} style={{ color: 'var(--color-primary)' }} />
                        )}
                        <span>{p.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
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
export default ProvinceSelect;

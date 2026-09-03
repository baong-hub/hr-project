import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check, Search } from 'lucide-react';
import styles from './MultiSelect.module.scss';

interface Option {
  id: number | string;
  name: string;
  disabled?: boolean;
}

interface Props {
  options: Option[];
  selectedIds: (number | string)[];
  onChange: (ids: (number | string)[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  maxSelect?: number;
}

export const MultiSelect = ({ options, selectedIds, onChange, placeholder, label, error, maxSelect }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (id: number | string) => {
    const option = options.find(o => o.id === id);
    if (option?.disabled) return;

    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      if (maxSelect !== undefined && selectedIds.length >= maxSelect) return;
      onChange([...selectedIds, id]);
    }
  };

  const removeOption = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(i => i !== id));
  };

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));

  return (
    <div className={styles.container} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div 
        className={`${styles.selectBox} ${isOpen ? styles.active : ''} ${error ? styles.hasError : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.values}>
          {selectedOptions.length > 0 ? (
            selectedOptions.map(opt => (
              <span key={opt.id} className={styles.tag}>
                {opt.name}
                <button type="button" onClick={(e) => removeOption(opt.id, e)}>
                  <X size={12} />
                </button>
              </span>
            ))
          ) : (
            <span className={styles.placeholder}>{placeholder || 'Chọn...'}</span>
          )}
        </div>
        <div className={styles.icons}>
          <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input 
              className={styles.searchInput}
              placeholder="Tìm kiếm..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className={styles.optionsList}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  className={`${styles.option} ${selectedIds.includes(opt.id) ? styles.selected : ''} ${opt.disabled ? styles.disabled : ''}`}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (!opt.disabled) toggleOption(opt.id); 
                  }}
                >
                  <span className={styles.optionName}>{opt.name}</span>
                  {selectedIds.includes(opt.id) && <Check size={14} className={styles.checkIcon} />}
                </div>
              ))
            ) : (
              <div className={styles.noOptions}>Không tìm thấy kết quả</div>
            )}
          </div>
        </div>
      )}
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
};

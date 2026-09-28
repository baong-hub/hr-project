import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Briefcase, MapPin, ChevronDown, X } from 'lucide-react';
import {
  metaService,
  type ProvinceItem,
  type IndustryItem,
  STATIC_PROVINCES,
  STATIC_INDUSTRIES,
  normalizeText
} from '../../../core/services/meta.service';
import styles from './SearchBar.module.scss';

export interface SearchBarProps {
  onSearch?: (params: { q: string; industries: string[]; provinces: string[]; mode?: string }) => void;
  className?: string;
  autoSyncUrl?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  className,
  autoSyncUrl = true
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Reference data
  const [industries, setIndustries] = useState<IndustryItem[]>(STATIC_INDUSTRIES);
  const [provinces, setProvinces] = useState<ProvinceItem[]>(STATIC_PROVINCES);

  // Form State
  const [keyword, setKeyword] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [isRemote, setIsRemote] = useState<boolean>(false);

  // Popover state
  const [industryPopoverOpen, setIndustryPopoverOpen] = useState(false);
  const [provincePopoverOpen, setProvincePopoverOpen] = useState(false);
  const [industryFilterText, setIndustryFilterText] = useState('');
  const [provinceFilterText, setProvinceFilterText] = useState('');

  const industryRef = useRef<HTMLDivElement>(null);
  const provinceRef = useRef<HTMLDivElement>(null);

  // Load metadata on mount
  useEffect(() => {
    metaService.getIndustries().then((data) => {
      if (data && data.length > 0) setIndustries(data);
    });
    metaService.getProvinces().then((data) => {
      if (data && data.length > 0) setProvinces(data);
    });
  }, []);

  // Initialize from URL params
  useEffect(() => {
    if (!autoSyncUrl) return;

    const q = searchParams.get('q') || searchParams.get('keyword') || searchParams.get('search') || '';
    setKeyword(q);

    const indStr = searchParams.get('industry') || searchParams.get('industries') || searchParams.get('category') || '';
    if (indStr) {
      setSelectedIndustries(indStr.split(',').map((s) => s.trim()).filter(Boolean));
    } else {
      setSelectedIndustries([]);
    }

    const provStr = searchParams.get('province') || searchParams.get('provinces') || searchParams.get('location') || searchParams.get('city') || '';
    if (provStr) {
      setSelectedProvinces(provStr.split(',').map((s) => s.trim()).filter(Boolean));
    } else {
      setSelectedProvinces([]);
    }

    const modeStr = searchParams.get('mode') || searchParams.get('workMode') || '';
    setIsRemote(modeStr.toLowerCase() === 'remote');
  }, [searchParams, autoSyncUrl]);

  // Click outside & Esc listener for popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (industryRef.current && !industryRef.current.contains(e.target as Node)) {
        setIndustryPopoverOpen(false);
      }
      if (provinceRef.current && !provinceRef.current.contains(e.target as Node)) {
        setProvincePopoverOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIndustryPopoverOpen(false);
        setProvincePopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filtered lists in popover
  const filteredIndustries = industries.filter((ind) => {
    if (!industryFilterText.trim()) return true;
    return normalizeText(ind.name).includes(normalizeText(industryFilterText));
  });

  const filteredProvinces = provinces.filter((p) => {
    if (!provinceFilterText.trim()) return true;
    const query = normalizeText(provinceFilterText);
    const inName = normalizeText(p.name).includes(query);
    const inAliases = p.aliases.some((a) => normalizeText(a).includes(query));
    const inLegacy = p.legacyNames.some((l) => normalizeText(l).includes(query));
    return inName || inAliases || inLegacy;
  });

  const toggleIndustry = (code: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleProvince = (code: string) => {
    setSelectedProvinces((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIndustryPopoverOpen(false);
    setProvincePopoverOpen(false);

    if (onSearch) {
      onSearch({
        q: keyword.trim(),
        industries: selectedIndustries,
        provinces: selectedProvinces,
        mode: isRemote ? 'remote' : undefined
      });
    }

    if (autoSyncUrl) {
      const next = new URLSearchParams();
      if (keyword.trim()) next.set('q', keyword.trim());
      if (selectedIndustries.length > 0) next.set('industry', selectedIndustries.join(','));
      if (selectedProvinces.length > 0) next.set('province', selectedProvinces.join(','));
      if (isRemote) next.set('mode', 'remote');

      // If we are already on /jobs, update search params; otherwise navigate to /jobs
      if (window.location.pathname === '/jobs') {
        setSearchParams(next);
      } else {
        navigate(`/jobs?${next.toString()}`);
      }
    }
  };

  const handleClearAll = () => {
    setKeyword('');
    setSelectedIndustries([]);
    setSelectedProvinces([]);
    setIsRemote(false);
    if (autoSyncUrl && window.location.pathname === '/jobs') {
      setSearchParams(new URLSearchParams());
    }
  };

  // Label text for dropdown triggers
  const getIndustryTriggerLabel = () => {
    if (selectedIndustries.length === 0) return 'Tất cả ngành nghề';
    if (selectedIndustries.length === 1) {
      const found = industries.find((i) => i.code === selectedIndustries[0]);
      return found ? found.name : '1 ngành nghề';
    }
    return `${selectedIndustries.length} ngành nghề`;
  };

  const getProvinceTriggerLabel = () => {
    const parts: string[] = [];
    if (selectedProvinces.length === 1) {
      const found = provinces.find((p) => p.code === selectedProvinces[0]);
      if (found) parts.push(found.name);
    } else if (selectedProvinces.length > 1) {
      parts.push(`${selectedProvinces.length} địa điểm`);
    }

    if (isRemote) {
      parts.push('Từ xa');
    }

    if (parts.length === 0) return 'Tất cả địa điểm';
    return parts.join(' + ');
  };

  const hasActiveFilters =
    keyword.trim() !== '' ||
    selectedIndustries.length > 0 ||
    selectedProvinces.length > 0 ||
    isRemote;

  return (
    <div className={`${styles.searchBarWrapper} ${className || ''}`}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        {/* Box 1: Từ khóa */}
        <div className={styles.inputGroup}>
          <Search size={18} className={styles.inputIcon} />
          <input
            type="text"
            className={styles.textInput}
            placeholder="Chức danh, từ khóa, công ty..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {keyword && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => setKeyword('')}
              aria-label="Xóa từ khóa"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Box 2: Ngành nghề */}
        <div className={styles.inputGroup} ref={industryRef}>
          <Briefcase size={18} className={styles.inputIcon} />
          <button
            type="button"
            className={styles.dropdownTrigger}
            onClick={() => {
              setIndustryPopoverOpen(!industryPopoverOpen);
              setProvincePopoverOpen(false);
            }}
            aria-expanded={industryPopoverOpen}
          >
            <span className={selectedIndustries.length === 0 ? styles.dropdownTriggerPlaceholder : ''}>
              {getIndustryTriggerLabel()}
            </span>
            <ChevronDown size={15} />
          </button>

          {/* Industry Popover */}
          {industryPopoverOpen && (
            <div className={styles.popoverDropdown} role="dialog" aria-label="Bảng chọn ngành nghề">
              <input
                type="text"
                className={styles.filterSearchInput}
                placeholder="Lọc nhanh ngành nghề..."
                value={industryFilterText}
                onChange={(e) => setIndustryFilterText(e.target.value)}
                autoFocus
              />

              <div className={styles.popoverContent}>
                <div className={styles.optionsGrid}>
                  {filteredIndustries.map((ind) => {
                    const checked = selectedIndustries.includes(ind.code);
                    return (
                      <label key={ind.code} className={styles.optionLabel}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleIndustry(ind.code)}
                        />
                        <span>{ind.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={styles.popoverFooter}>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => setSelectedIndustries([])}
                >
                  Bỏ chọn tất cả
                </button>
                <button
                  type="button"
                  className={styles.doneBtn}
                  onClick={() => setIndustryPopoverOpen(false)}
                >
                  Đóng ({selectedIndustries.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Box 3: Địa điểm */}
        <div className={styles.inputGroup} ref={provinceRef}>
          <MapPin size={18} className={styles.inputIcon} />
          <button
            type="button"
            className={styles.dropdownTrigger}
            onClick={() => {
              setProvincePopoverOpen(!provincePopoverOpen);
              setIndustryPopoverOpen(false);
            }}
            aria-expanded={provincePopoverOpen}
          >
            <span className={selectedProvinces.length === 0 && !isRemote ? styles.dropdownTriggerPlaceholder : ''}>
              {getProvinceTriggerLabel()}
            </span>
            <ChevronDown size={15} />
          </button>

          {/* Province Popover */}
          {provincePopoverOpen && (
            <div className={styles.popoverDropdown} role="dialog" aria-label="Bảng chọn địa điểm">
              <input
                type="text"
                className={styles.filterSearchInput}
                placeholder="Tìm tỉnh/thành (gõ 'Bình Dương' ra TP.HCM)..."
                value={provinceFilterText}
                onChange={(e) => setProvinceFilterText(e.target.value)}
                autoFocus
              />

              <div className={styles.popoverContent}>
                {/* Làm việc từ xa option */}
                <label className={styles.optionLabel}>
                  <input
                    type="checkbox"
                    checked={isRemote}
                    onChange={(e) => setIsRemote(e.target.checked)}
                  />
                  <strong>Làm việc từ xa (Remote)</strong>
                </label>

                {/* Thành phố trực thuộc trung ương */}
                <div>
                  <div className={styles.sectionTitle}>Thành phố trực thuộc TW (6)</div>
                  <div className={styles.optionsGrid}>
                    {filteredProvinces
                      .filter((p) => p.type === 'city')
                      .map((p) => {
                        const checked = selectedProvinces.includes(p.code);
                        return (
                          <label key={p.code} className={styles.optionLabel}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProvince(p.code)}
                            />
                            <div>
                              <span>{p.name}</span>
                              {p.legacyNames.length > 0 && (
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

                {/* Các tỉnh */}
                <div>
                  <div className={styles.sectionTitle}>Tỉnh (28)</div>
                  <div className={styles.optionsGrid}>
                    {filteredProvinces
                      .filter((p) => p.type === 'province')
                      .map((p) => {
                        const checked = selectedProvinces.includes(p.code);
                        return (
                          <label key={p.code} className={styles.optionLabel}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProvince(p.code)}
                            />
                            <div>
                              <span>{p.name}</span>
                              {p.legacyNames.length > 0 && (
                                <span className={styles.legacyNote}>
                                  (gồm {p.legacyNames.join(', ')})
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div className={styles.popoverFooter}>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => {
                    setSelectedProvinces([]);
                    setIsRemote(false);
                  }}
                >
                  Bỏ chọn tất cả
                </button>
                <button
                  type="button"
                  className={styles.doneBtn}
                  onClick={() => setProvincePopoverOpen(false)}
                >
                  Đóng ({selectedProvinces.length + (isRemote ? 1 : 0)})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nút Tìm việc */}
        <button type="submit" className={styles.submitBtn}>
          <Search size={16} />
          <span>Tìm việc</span>
        </button>
      </form>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className={styles.chipsRow}>
          {keyword && (
            <span className={styles.chip}>
              Từ khóa: &ldquo;{keyword}&rdquo;
              <button type="button" onClick={() => setKeyword('')}>
                <X size={12} />
              </button>
            </span>
          )}

          {selectedIndustries.map((code) => {
            const ind = industries.find((i) => i.code === code);
            return (
              <span key={code} className={styles.chip}>
                {ind ? ind.name : code}
                <button type="button" onClick={() => toggleIndustry(code)}>
                  <X size={12} />
                </button>
              </span>
            );
          })}

          {selectedProvinces.map((code) => {
            const prov = provinces.find((p) => p.code === code);
            return (
              <span key={code} className={styles.chip}>
                {prov ? prov.name : code}
                <button type="button" onClick={() => toggleProvince(code)}>
                  <X size={12} />
                </button>
              </span>
            );
          })}

          {isRemote && (
            <span className={styles.chip}>
              Làm từ xa
              <button type="button" onClick={() => setIsRemote(false)}>
                <X size={12} />
              </button>
            </span>
          )}

          <button type="button" className={styles.clearAllBtn} onClick={handleClearAll}>
            Xóa lọc
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

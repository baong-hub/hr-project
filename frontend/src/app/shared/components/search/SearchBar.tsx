import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import {
  metaService,
  type ProvinceItem,
  type IndustryItem,
  STATIC_PROVINCES,
  STATIC_INDUSTRIES
} from '../../../core/services/meta.service';
import { IndustrySelect } from './IndustrySelect';
import { ProvinceSelect } from './ProvinceSelect';
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

  // Reference data for chips
  const [industries, setIndustries] = useState<IndustryItem[]>(STATIC_INDUSTRIES);
  const [provinces, setProvinces] = useState<ProvinceItem[]>(STATIC_PROVINCES);

  // Form State
  const [keyword, setKeyword] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [isRemote, setIsRemote] = useState<boolean>(false);

  // Load metadata on mount for chips
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

        {/* Box 2: Ngành nghề (dùng IndustrySelect) */}
        <IndustrySelect
          value={selectedIndustries}
          onChange={(codes) => setSelectedIndustries(codes)}
          multiple={true}
          placeholder="Tất cả ngành nghề"
        />

        {/* Box 3: Địa điểm (dùng ProvinceSelect) */}
        <ProvinceSelect
          value={selectedProvinces}
          onChange={(codes) => setSelectedProvinces(codes)}
          multiple={true}
          includeRemote={true}
          isRemote={isRemote}
          onRemoteChange={setIsRemote}
          placeholder="Tất cả địa điểm"
        />

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

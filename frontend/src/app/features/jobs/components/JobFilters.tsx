import React, { useState, useMemo } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { ProvinceItem, IndustryItem } from '../../../core/services/meta.service';
import type { ActiveFiltersState } from './ActiveFilterChips';
import styles from './JobFilters.module.scss';

export interface JobFacetsData {
  totalJobs: number;
  provinces: Record<string, number>;
  categories: Record<string, number>;
  salaryRanges: Record<string, number>;
  experienceLevels: Record<string, number>;
  employmentTypes: Record<string, number>;
  workModes: Record<string, number>;
}

interface JobFiltersProps {
  filters: ActiveFiltersState;
  onFilterChange: (key: keyof ActiveFiltersState, value: string) => void;
  onClearAll: () => void;
  provinces: ProvinceItem[];
  industries: IndustryItem[];
  facets: JobFacetsData | null;
  className?: string;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  onFilterChange,
  onClearAll,
  provinces,
  industries,
  facets,
  className,
}) => {
  // Expanded section states
  const [expanded, setExpanded] = useState({
    industry: true,
    province: true,
    salary: true,
    level: true,
    type: false,
    mode: false,
    posted: false,
  });

  // Section internal search queries
  const [industrySearch, setIndustrySearch] = useState('');
  const [provinceSearch, setProvinceSearch] = useState('');

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Filtered industries
  const filteredIndustries = useMemo(() => {
    if (!industrySearch.trim()) return industries;
    const q = industrySearch.toLowerCase().trim();
    return industries.filter(
      (ind) =>
        ind.name.toLowerCase().includes(q) || ind.code.toLowerCase().includes(q)
    );
  }, [industries, industrySearch]);

  // Filtered provinces
  const filteredProvinces = useMemo(() => {
    if (!provinceSearch.trim()) return provinces;
    const q = provinceSearch.toLowerCase().trim();
    return provinces.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.aliases.some((a) => a.toLowerCase().includes(q)) ||
        p.legacyNames.some((l) => l.toLowerCase().includes(q))
    );
  }, [provinces, provinceSearch]);

  const salaryOptions = [
    { value: '', label: 'Tất cả mức lương' },
    { value: 'under-10m', label: 'Dưới 10 triệu', key: 'under-10m' },
    { value: '10m-20m', label: '10 - 20 triệu', key: '10m-20m' },
    { value: '20m-35m', label: '20 - 35 triệu', key: '20m-35m' },
    { value: '35m-50m', label: '35 - 50 triệu', key: '35m-50m' },
    { value: 'above-50m', label: 'Trên 50 triệu', key: 'above-50m' },
    { value: 'negotiable', label: 'Thỏa thuận', key: 'negotiable' },
  ];

  const levelOptions = [
    { value: '', label: 'Tất cả cấp bậc' },
    { value: 'intern', label: 'Thực tập sinh', key: 'INTERN' },
    { value: 'fresher', label: 'Fresher / Mới tốt nghiệp', key: 'FRESHER' },
    { value: 'junior', label: 'Junior (1 - 2 năm)', key: 'JUNIOR' },
    { value: 'middle', label: 'Middle (2 - 4 năm)', key: 'MIDDLE' },
    { value: 'senior', label: 'Senior (5+ năm)', key: 'SENIOR' },
    { value: 'lead', label: 'Trưởng nhóm / Leader', key: 'LEAD' },
    { value: 'manager', label: 'Quản lý / Giám đốc', key: 'MANAGER' },
  ];

  const typeOptions = [
    { value: '', label: 'Tất cả hình thức' },
    { value: 'full-time', label: 'Toàn thời gian', key: 'FULL_TIME' },
    { value: 'part-time', label: 'Bán thời gian', key: 'PART_TIME' },
    { value: 'contract', label: 'Hợp đồng', key: 'CONTRACT' },
    { value: 'internship', label: 'Thực tập', key: 'INTERNSHIP' },
  ];

  const modeOptions = [
    { value: '', label: 'Tất cả chế độ' },
    { value: 'on-site', label: 'Tại văn phòng', key: 'ON_SITE' },
    { value: 'hybrid', label: 'Kết hợp (Hybrid)', key: 'HYBRID' },
    { value: 'remote', label: 'Làm việc từ xa (Remote)', key: 'REMOTE' },
  ];

  const postedOptions = [
    { value: '', label: 'Mọi thời điểm' },
    { value: '1', label: '24 giờ qua' },
    { value: '3', label: '3 ngày qua' },
    { value: '7', label: '7 ngày qua' },
    { value: '14', label: '14 ngày qua' },
    { value: '30', label: '30 ngày qua' },
  ];

  const getFacetCount = (dict: Record<string, number> | undefined, key: string) => {
    if (!dict) return undefined;
    return dict[key] ?? dict[key.toLowerCase()] ?? dict[key.toUpperCase()];
  };

  return (
    <aside className={`${styles.filterSidebar} ${className || ''}`} aria-label="Bộ lọc tìm kiếm việc làm">
      <div className={styles.sidebarHeader}>
        <h2>
          <SlidersHorizontal size={16} /> Bộ lọc nâng cao
        </h2>
        <button type="button" className={styles.resetBtn} onClick={onClearAll}>
          Đặt lại
        </button>
      </div>

      {/* 1. Ngành nghề */}
      <div className={styles.filterSection}>
        <button
          type="button"
          className={`${styles.sectionHeader} ${expanded.industry ? styles.expanded : ''}`}
          onClick={() => toggleSection('industry')}
          aria-expanded={expanded.industry}
        >
          <span>Ngành nghề & Lĩnh vực</span>
          <ChevronDown size={14} className={styles.chevron} />
        </button>

        {expanded.industry && (
          <div className={styles.sectionBody}>
            <input
              type="text"
              placeholder="Tìm kiếm ngành nghề..."
              value={industrySearch}
              onChange={(e) => setIndustrySearch(e.target.value)}
              className={styles.searchWithinSection}
            />
            <div className={styles.optionList}>
              <label
                className={`${styles.optionItem} ${!filters.industry ? styles.active : ''}`}
                onClick={() => onFilterChange('industry', '')}
              >
                <div className={styles.labelWrapper}>
                  <input
                    type="radio"
                    name="industry"
                    checked={!filters.industry}
                    onChange={() => onFilterChange('industry', '')}
                  />
                  <span>Tất cả ngành nghề</span>
                </div>
              </label>

              {filteredIndustries.map((ind) => {
                const count = getFacetCount(facets?.categories, ind.code) ?? ind.jobCount;
                const isActive =
                  filters.industry?.toLowerCase() === ind.code.toLowerCase() ||
                  filters.industry?.toLowerCase() === ind.name.toLowerCase();

                return (
                  <label
                    key={ind.code}
                    className={`${styles.optionItem} ${isActive ? styles.active : ''}`}
                    onClick={() => onFilterChange('industry', isActive ? '' : ind.code)}
                  >
                    <div className={styles.labelWrapper}>
                      <input
                        type="radio"
                        name="industry"
                        checked={isActive}
                        onChange={() => onFilterChange('industry', isActive ? '' : ind.code)}
                      />
                      <span title={ind.name}>{ind.name}</span>
                    </div>
                    {count !== undefined && count > 0 && (
                      <span className={styles.countBadge}>{count}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Địa điểm (34 đơn vị hành chính) */}
      <div className={styles.filterSection}>
        <button
          type="button"
          className={`${styles.sectionHeader} ${expanded.province ? styles.expanded : ''}`}
          onClick={() => toggleSection('province')}
          aria-expanded={expanded.province}
        >
          <span>Tỉnh / Thành phố</span>
          <ChevronDown size={14} className={styles.chevron} />
        </button>

        {expanded.province && (
          <div className={styles.sectionBody}>
            <input
              type="text"
              placeholder="Tìm kiếm tỉnh, thành..."
              value={provinceSearch}
              onChange={(e) => setProvinceSearch(e.target.value)}
              className={styles.searchWithinSection}
            />
            <div className={styles.optionList}>
              <label
                className={`${styles.optionItem} ${!filters.province ? styles.active : ''}`}
                onClick={() => onFilterChange('province', '')}
              >
                <div className={styles.labelWrapper}>
                  <input
                    type="radio"
                    name="province"
                    checked={!filters.province}
                    onChange={() => onFilterChange('province', '')}
                  />
                  <span>Toàn quốc</span>
                </div>
              </label>

              {filteredProvinces.map((prov) => {
                const count = getFacetCount(facets?.provinces, prov.code) ?? prov.jobCount;
                const isActive =
                  filters.province?.toLowerCase() === prov.code.toLowerCase() ||
                  filters.province?.toLowerCase() === prov.name.toLowerCase();

                return (
                  <label
                    key={prov.code}
                    className={`${styles.optionItem} ${isActive ? styles.active : ''}`}
                    onClick={() => onFilterChange('province', isActive ? '' : prov.code)}
                  >
                    <div className={styles.labelWrapper}>
                      <input
                        type="radio"
                        name="province"
                        checked={isActive}
                        onChange={() => onFilterChange('province', isActive ? '' : prov.code)}
                      />
                      <span>{prov.name}</span>
                    </div>
                    {count !== undefined && count > 0 && (
                      <span className={styles.countBadge}>{count}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Mức lương */}
      <div className={styles.filterSection}>
        <button
          type="button"
          className={`${styles.sectionHeader} ${expanded.salary ? styles.expanded : ''}`}
          onClick={() => toggleSection('salary')}
          aria-expanded={expanded.salary}
        >
          <span>Mức lương</span>
          <ChevronDown size={14} className={styles.chevron} />
        </button>

        {expanded.salary && (
          <div className={styles.sectionBody}>
            <div className={styles.optionList}>
              {salaryOptions.map((opt) => {
                const count = opt.key ? getFacetCount(facets?.salaryRanges, opt.key) : undefined;
                const isActive = filters.salary === opt.value;

                return (
                  <label
                    key={opt.value}
                    className={`${styles.optionItem} ${isActive ? styles.active : ''}`}
                    onClick={() => onFilterChange('salary', isActive ? '' : opt.value)}
                  >
                    <div className={styles.labelWrapper}>
                      <input
                        type="radio"
                        name="salary"
                        checked={isActive}
                        onChange={() => onFilterChange('salary', isActive ? '' : opt.value)}
                      />
                      <span>{opt.label}</span>
                    </div>
                    {count !== undefined && count > 0 && (
                      <span className={styles.countBadge}>{count}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Cấp bậc / Kinh nghiệm */}
      <div className={styles.filterSection}>
        <button
          type="button"
          className={`${styles.sectionHeader} ${expanded.level ? styles.expanded : ''}`}
          onClick={() => toggleSection('level')}
          aria-expanded={expanded.level}
        >
          <span>Kinh nghiệm & Cấp bậc</span>
          <ChevronDown size={14} className={styles.chevron} />
        </button>

        {expanded.level && (
          <div className={styles.sectionBody}>
            <div className={styles.optionList}>
              {levelOptions.map((opt) => {
                const count = opt.key ? getFacetCount(facets?.experienceLevels, opt.key) : undefined;
                const isActive = filters.level === opt.value;

                return (
                  <label
                    key={opt.value}
                    className={`${styles.optionItem} ${isActive ? styles.active : ''}`}
                    onClick={() => onFilterChange('level', isActive ? '' : opt.value)}
                  >
                    <div className={styles.labelWrapper}>
                      <input
                        type="radio"
                        name="level"
                        checked={isActive}
                        onChange={() => onFilterChange('level', isActive ? '' : opt.value)}
                      />
                      <span>{opt.label}</span>
                    </div>
                    {count !== undefined && count > 0 && (
                      <span className={styles.countBadge}>{count}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Chế độ làm việc (On-site, Hybrid, Remote) */}
      <div className={styles.filterSection}>
        <button
          type="button"
          className={`${styles.sectionHeader} ${expanded.mode ? styles.expanded : ''}`}
          onClick={() => toggleSection('mode')}
          aria-expanded={expanded.mode}
        >
          <span>Chế độ làm việc</span>
          <ChevronDown size={14} className={styles.chevron} />
        </button>

        {expanded.mode && (
          <div className={styles.sectionBody}>
            <div className={styles.optionList}>
              {modeOptions.map((opt) => {
                const count = opt.key ? getFacetCount(facets?.workModes, opt.key) : undefined;
                const isActive = filters.mode === opt.value;

                return (
                  <label
                    key={opt.value}
                    className={`${styles.optionItem} ${isActive ? styles.active : ''}`}
                    onClick={() => onFilterChange('mode', isActive ? '' : opt.value)}
                  >
                    <div className={styles.labelWrapper}>
                      <input
                        type="radio"
                        name="mode"
                        checked={isActive}
                        onChange={() => onFilterChange('mode', isActive ? '' : opt.value)}
                      />
                      <span>{opt.label}</span>
                    </div>
                    {count !== undefined && count > 0 && (
                      <span className={styles.countBadge}>{count}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 6. Hình thức làm việc */}
      <div className={styles.filterSection}>
        <button
          type="button"
          className={`${styles.sectionHeader} ${expanded.type ? styles.expanded : ''}`}
          onClick={() => toggleSection('type')}
          aria-expanded={expanded.type}
        >
          <span>Hình thức làm việc</span>
          <ChevronDown size={14} className={styles.chevron} />
        </button>

        {expanded.type && (
          <div className={styles.sectionBody}>
            <div className={styles.optionList}>
              {typeOptions.map((opt) => {
                const count = opt.key ? getFacetCount(facets?.employmentTypes, opt.key) : undefined;
                const isActive = filters.type === opt.value;

                return (
                  <label
                    key={opt.value}
                    className={`${styles.optionItem} ${isActive ? styles.active : ''}`}
                    onClick={() => onFilterChange('type', isActive ? '' : opt.value)}
                  >
                    <div className={styles.labelWrapper}>
                      <input
                        type="radio"
                        name="type"
                        checked={isActive}
                        onChange={() => onFilterChange('type', isActive ? '' : opt.value)}
                      />
                      <span>{opt.label}</span>
                    </div>
                    {count !== undefined && count > 0 && (
                      <span className={styles.countBadge}>{count}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 7. Thời gian đăng tin */}
      <div className={styles.filterSection}>
        <button
          type="button"
          className={`${styles.sectionHeader} ${expanded.posted ? styles.expanded : ''}`}
          onClick={() => toggleSection('posted')}
          aria-expanded={expanded.posted}
        >
          <span>Thời gian đăng tin</span>
          <ChevronDown size={14} className={styles.chevron} />
        </button>

        {expanded.posted && (
          <div className={styles.sectionBody}>
            <div className={styles.optionList}>
              {postedOptions.map((opt) => {
                const isActive = filters.posted === opt.value;

                return (
                  <label
                    key={opt.value}
                    className={`${styles.optionItem} ${isActive ? styles.active : ''}`}
                    onClick={() => onFilterChange('posted', isActive ? '' : opt.value)}
                  >
                    <div className={styles.labelWrapper}>
                      <input
                        type="radio"
                        name="posted"
                        checked={isActive}
                        onChange={() => onFilterChange('posted', isActive ? '' : opt.value)}
                      />
                      <span>{opt.label}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default JobFilters;

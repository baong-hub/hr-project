import React from 'react';
import { X } from 'lucide-react';
import styles from './ActiveFilterChips.module.scss';

export interface ActiveFiltersState {
  search?: string;
  province?: string;
  industry?: string;
  salary?: string;
  level?: string;
  type?: string;
  mode?: string;
  posted?: string;
  sort?: string;
}

interface ActiveFilterChipsProps {
  totalCount: number;
  filters: ActiveFiltersState;
  provinceName?: string;
  industryName?: string;
  onRemoveFilter: (key: keyof ActiveFiltersState) => void;
  onClearAll: () => void;
  sortValue: string;
  onSortChange: (newSort: string) => void;
}

const SALARY_LABELS: Record<string, string> = {
  'under-10m': 'Dưới 10 triệu',
  '10m-20m': '10 - 20 triệu',
  '20m-35m': '20 - 35 triệu',
  '35m-50m': '35 - 50 triệu',
  'above-50m': 'Trên 50 triệu',
  '10000000': 'Từ 10 triệu',
  '20000000': 'Từ 20 triệu',
  '30000000': 'Từ 30 triệu',
  '40000000': 'Từ 40 triệu',
  'negotiable': 'Thỏa thuận',
};

const LEVEL_LABELS: Record<string, string> = {
  'intern': 'Thực tập sinh',
  'fresher': 'Fresher / Mới tốt nghiệp',
  'junior': 'Junior (1 - 2 năm)',
  'middle': 'Middle (2 - 4 năm)',
  'senior': 'Senior (5+ năm)',
  'lead': 'Trưởng nhóm / Leader',
  'manager': 'Quản lý / Giám đốc',
};

const TYPE_LABELS: Record<string, string> = {
  'full-time': 'Toàn thời gian',
  'part-time': 'Bán thời gian',
  'contract': 'Hợp đồng dự án',
  'internship': 'Thực tập',
};

const MODE_LABELS: Record<string, string> = {
  'on-site': 'Tại văn phòng',
  'hybrid': 'Kết hợp (Hybrid)',
  'remote': 'Làm việc từ xa (Remote)',
};

const POSTED_LABELS: Record<string, string> = {
  '1': '24 giờ qua',
  '3': '3 ngày qua',
  '7': '7 ngày qua',
  '14': '14 ngày qua',
  '30': '30 ngày qua',
};

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  totalCount,
  filters,
  provinceName,
  industryName,
  onRemoveFilter,
  onClearAll,
  sortValue,
  onSortChange,
}) => {
  const chips: { key: keyof ActiveFiltersState; label: string; value: string }[] = [];

  if (filters.search?.trim()) {
    chips.push({ key: 'search', label: 'Từ khóa', value: `"${filters.search.trim()}"` });
  }
  if (filters.province?.trim()) {
    chips.push({ key: 'province', label: 'Khu vực', value: provinceName || filters.province });
  }
  if (filters.industry?.trim()) {
    chips.push({ key: 'industry', label: 'Ngành nghề', value: industryName || filters.industry });
  }
  if (filters.salary?.trim()) {
    chips.push({
      key: 'salary',
      label: 'Mức lương',
      value: SALARY_LABELS[filters.salary] || filters.salary,
    });
  }
  if (filters.level?.trim()) {
    chips.push({
      key: 'level',
      label: 'Kinh nghiệm',
      value: LEVEL_LABELS[filters.level.toLowerCase()] || filters.level,
    });
  }
  if (filters.type?.trim()) {
    chips.push({
      key: 'type',
      label: 'Hình thức',
      value: TYPE_LABELS[filters.type.toLowerCase()] || filters.type,
    });
  }
  if (filters.mode?.trim()) {
    chips.push({
      key: 'mode',
      label: 'Chế độ',
      value: MODE_LABELS[filters.mode.toLowerCase()] || filters.mode,
    });
  }
  if (filters.posted?.trim()) {
    chips.push({
      key: 'posted',
      label: 'Ngày đăng',
      value: POSTED_LABELS[filters.posted] || `${filters.posted} ngày qua`,
    });
  }

  return (
    <div className={styles.chipsContainer}>
      <div className={styles.headerRow}>
        <div className={styles.resultCount}>
          Tìm thấy <strong>{totalCount.toLocaleString('vi-VN')}</strong> việc làm phù hợp
        </div>

        <div className={styles.sortSelector}>
          <label htmlFor="job-sort-select">Sắp xếp theo:</label>
          <select
            id="job-sort-select"
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="newest">Mới nhất</option>
            <option value="salary_desc">Lương cao nhất</option>
            <option value="deadline_asc">Hạn nộp gần nhất</option>
          </select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className={styles.chipsList}>
          {chips.map((chip) => (
            <span key={chip.key} className={styles.chip}>
              <span className={styles.chipLabel}>{chip.label}:</span>
              <span className={styles.chipValue}>{chip.value}</span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => onRemoveFilter(chip.key)}
                aria-label={`Xóa bộ lọc ${chip.label}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}

          <button
            type="button"
            className={styles.clearAllBtn}
            onClick={onClearAll}
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};

export default ActiveFilterChips;

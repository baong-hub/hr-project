import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Briefcase,
  BarChart3,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { salaryInsightsService, type SalaryInsightsResult } from '../../../core/services/salary-insights.service';
import { metaService, type ProvinceItem, type IndustryItem } from '../../../core/services/meta.service';
import { SeoHead } from '../../../shared/components/SeoHead';
import styles from './SalaryInsightsPage.module.scss';

export const SalaryInsightsPage: React.FC = () => {
  const [category, setCategory] = useState<string>('all');
  const [location, setLocation] = useState<string>('all');
  const [insights, setInsights] = useState<SalaryInsightsResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Metadata
  const [industries, setIndustries] = useState<IndustryItem[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);

  useEffect(() => {
    Promise.all([metaService.getIndustries(), metaService.getProvinces()])
      .then(([indList, provList]) => {
        setIndustries(indList);
        setProvinces(provList);
      })
      .catch((err) => console.error('Failed to load metadata', err));
  }, []);

  useEffect(() => {
    setLoading(true);
    salaryInsightsService
      .getSalaryInsights(category === 'all' ? undefined : category, location === 'all' ? undefined : location)
      .then(setInsights)
      .catch((err) => console.error('Failed to load salary insights:', err))
      .finally(() => setLoading(false));
  }, [category, location]);

  const maxCategorySalary = insights?.byCategory?.length
    ? Math.max(...insights.byCategory.map((c) => c.medianSalaryMillionVnd || 0), 1)
    : 1;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Báo cáo khảo sát thị trường mức lương Việt Nam 2026',
    description:
      'Báo cáo thống kê phân tích mức lương thị trường theo ngành nghề, cấp bậc và kỹ năng chuyên môn từ HR Portal.',
    creator: {
      '@type': 'Organization',
      name: 'HR Portal',
    },
    temporalCoverage: '2026',
    spatialCoverage: 'Vietnam',
  };

  return (
    <div className={styles.salaryPage}>
      <SeoHead
        title="Báo cáo thị trường lương theo ngành & vị trí 2026 | HR Portal"
        description="Tra cứu mức lương chuẩn xác theo ngành nghề, vị trí và cấp bậc. Phân tích dải lương P25 - P75 và top kỹ năng được trả lương cao nhất tại Việt Nam."
        canonicalUrl="https://tuyendung.hamo.vn/salary-insights"
        jsonLd={jsonLdData}
      />

      {/* Hero Card */}
      <section className={styles.heroCard} aria-label="Tiêu đề báo cáo lương">
        <div className={styles.heroTag}>
          <TrendingUp size={14} />
          <span>Dữ liệu thị trường 2026</span>
        </div>
        <h1>Báo cáo Mức lương theo Ngành nghề & Cấp bậc</h1>
        <p>
          Tổng hợp và phân tích thực tế từ{' '}
          <strong>{insights ? (insights.totalJobsAnalyzed || 0).toLocaleString('vi-VN') : '0'}</strong> tin tuyển
          dụng và thỏa thuận lương trên hệ thống.
        </p>

        {/* Quick Filters */}
        <div className={styles.filterRow}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Chọn ngành nghề"
          >
            <option value="all">Tất cả ngành nghề</option>
            {industries.map((ind) => (
              <option key={ind.code} value={ind.code}>
                {ind.name}
              </option>
            ))}
          </select>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            aria-label="Chọn khu vực"
          >
            <option value="all">Toàn quốc</option>
            {provinces.map((prov) => (
              <option key={prov.code} value={prov.code}>
                {prov.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {loading ? (
        <div className={styles.loadingBox}>
          <TrendingUp size={36} />
          <p>Đang tổng hợp dữ liệu mức lương thị trường...</p>
        </div>
      ) : insights ? (
        <>
          {/* 4 Summary Metric Cards */}
          <section className={styles.metricsGrid} aria-label="Chỉ số lương tổng quan">
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Lương trung vị (Median)</span>
              <span className={`${styles.metricValue} ${styles.salaryGold}`}>
                {insights.overallMedianMillionVnd || 0} tr
              </span>
              <p className={styles.metricSub}>Điểm cân bằng 50% thị trường (VNĐ/tháng)</p>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Lương trung bình</span>
              <span className={styles.metricValue}>
                {insights.overallAverageMillionVnd || 0} tr
              </span>
              <p className={styles.metricSub}>Mức bình quân tổng hợp (VNĐ/tháng)</p>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Dải phổ thông P25</span>
              <span className={styles.metricValue}>
                {insights.overallP25MillionVnd || 0} tr
              </span>
              <p className={styles.metricSub}>25% ứng viên nhận mức dưới ngưỡng này</p>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Dải nâng cao P75</span>
              <span className={styles.metricValue}>
                {insights.overallP75MillionVnd || 0} tr
              </span>
              <p className={styles.metricSub}>75% ứng viên nhận mức dưới ngưỡng này</p>
            </div>
          </section>

          {/* Table: Salary by Experience Level */}
          {insights.byExperienceLevel && insights.byExperienceLevel.length > 0 && (
            <section className={styles.sectionCard} aria-label="Bảng lương theo cấp bậc">
              <div className={styles.sectionHeader}>
                <h2>
                  <Briefcase size={18} /> Phân bổ mức lương theo Cấp bậc kinh nghiệm
                </h2>
                <span className={styles.sectionNote}>Đơn vị: Triệu VNĐ / tháng</span>
              </div>

              <div className={styles.benchmarkTableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th>Cấp bậc</th>
                      <th className={styles.numeric}>Thấp nhất</th>
                      <th className={styles.numeric}>Dải P25</th>
                      <th className={styles.numeric}>Trung vị (P50)</th>
                      <th className={styles.numeric}>Dải P75</th>
                      <th className={styles.numeric}>Cao nhất</th>
                      <th>Cỡ mẫu dữ liệu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.byExperienceLevel.map((lvl) => {
                      const isSmallSample = lvl.sampleCount < 10;

                      return (
                        <tr key={lvl.title}>
                          <td>
                            <strong>{lvl.title}</strong>
                          </td>
                          <td className={styles.numeric}>{lvl.minSalaryMillionVnd} tr</td>
                          <td className={styles.numeric}>{lvl.p25MillionVnd} tr</td>
                          <td className={`${styles.numeric} ${styles.salaryHighlight}`}>
                            {lvl.medianSalaryMillionVnd} tr
                          </td>
                          <td className={styles.numeric}>{lvl.p75MillionVnd} tr</td>
                          <td className={styles.numeric}>{lvl.maxSalaryMillionVnd} tr</td>
                          <td>
                            <span
                              className={`${styles.sampleSizeBadge} ${isSmallSample ? styles.smallSample : ''}`}
                            >
                              {isSmallSample && <AlertTriangle size={11} />}
                              {isSmallSample
                                ? `Cỡ mẫu nhỏ (n = ${lvl.sampleCount})`
                                : `n = ${lvl.sampleCount} tin`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Monochromatic Industry Comparison */}
          {insights.byCategory && insights.byCategory.length > 0 && (
            <section className={styles.sectionCard} aria-label="So sánh lương theo ngành">
              <div className={styles.sectionHeader}>
                <h2>
                  <BarChart3 size={18} /> Mức lương trung vị theo Lĩnh vực & Chuyên ngành
                </h2>
                <span className={styles.sectionNote}>Dựa trên tỷ lệ chuẩn hóa thị trường</span>
              </div>

              <div className={styles.categoryBarsList}>
                {insights.byCategory.map((cat) => {
                  const pct = Math.min(100, Math.round(((cat.medianSalaryMillionVnd || 0) / maxCategorySalary) * 100));

                  return (
                    <div key={cat.category} className={styles.barRow}>
                      <div className={styles.barLabelRow}>
                        <span className={styles.catName}>
                          {cat.category} ({cat.jobCount} tin)
                        </span>
                        <span className={styles.catSalary}>
                          {cat.medianSalaryMillionVnd} triệu VNĐ
                        </span>
                      </div>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{ '--bar-pct': `${Math.max(8, pct)}%` } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Top Paying Skills */}
          {insights.topPayingSkills && insights.topPayingSkills.length > 0 && (
            <section className={styles.sectionCard} aria-label="Kỹ năng được trả lương cao">
              <div className={styles.sectionHeader}>
                <h2>
                  <Award size={18} /> Top Kỹ năng có mức lương hấp dẫn
                </h2>
                <span className={styles.sectionNote}>Trung vị lương theo từng kỹ năng</span>
              </div>

              <div className={styles.skillsGrid}>
                {insights.topPayingSkills.map((sk) => (
                  <div key={sk.skill} className={styles.skillPill}>
                    <span className={styles.skillName}>{sk.skill}</span>
                    <span className={styles.skillPay}>{sk.medianSalaryMillionVnd} triệu</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className={styles.loadingBox}>
          <p>Không có dữ liệu khảo sát phù hợp với tiêu chí lọc.</p>
        </div>
      )}
    </div>
  );
};

export default SalaryInsightsPage;

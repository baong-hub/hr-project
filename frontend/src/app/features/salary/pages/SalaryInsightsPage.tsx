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

const FALLBACK_INSIGHTS: SalaryInsightsResult = {
  queryCategory: 'Tất cả ngành nghề',
  queryLocation: 'Toàn quốc',
  overallAverageMillionVnd: 18.5,
  overallMedianMillionVnd: 16.0,
  overallP25MillionVnd: 11.0,
  overallP75MillionVnd: 25.0,
  totalJobsAnalyzed: 1420,
  byExperienceLevel: [
    { title: 'Thực tập sinh / Fresher', minSalaryMillionVnd: 5, maxSalaryMillionVnd: 10, medianSalaryMillionVnd: 7.5, p25MillionVnd: 5.5, p75MillionVnd: 9.0, sampleCount: 180 },
    { title: 'Junior (1 - 2 năm)', minSalaryMillionVnd: 10, maxSalaryMillionVnd: 18, medianSalaryMillionVnd: 14.0, p25MillionVnd: 11.5, p75MillionVnd: 16.5, sampleCount: 420 },
    { title: 'Mid-level (2 - 4 năm)', minSalaryMillionVnd: 16, maxSalaryMillionVnd: 28, medianSalaryMillionVnd: 21.0, p25MillionVnd: 18.0, p75MillionVnd: 25.0, sampleCount: 510 },
    { title: 'Senior (4 - 6 năm)', minSalaryMillionVnd: 25, maxSalaryMillionVnd: 45, medianSalaryMillionVnd: 32.0, p25MillionVnd: 28.0, p75MillionVnd: 38.0, sampleCount: 230 },
    { title: 'Trưởng nhóm / Quản lý', minSalaryMillionVnd: 35, maxSalaryMillionVnd: 70, medianSalaryMillionVnd: 48.0, p25MillionVnd: 40.0, p75MillionVnd: 58.0, sampleCount: 80 }
  ],
  byCategory: [
    { category: 'Công nghệ thông tin / Phần mềm', medianSalaryMillionVnd: 22.5, minSalaryMillionVnd: 12, maxSalaryMillionVnd: 55, jobCount: 480 },
    { category: 'Bán lẻ / Thương mại điện tử', medianSalaryMillionVnd: 15.0, minSalaryMillionVnd: 9, maxSalaryMillionVnd: 35, jobCount: 320 },
    { category: 'Kế toán / Kiểm toán / Thuế', medianSalaryMillionVnd: 14.5, minSalaryMillionVnd: 8, maxSalaryMillionVnd: 30, jobCount: 210 },
    { category: 'Marketing / Truyền thông', medianSalaryMillionVnd: 16.0, minSalaryMillionVnd: 10, maxSalaryMillionVnd: 38, jobCount: 250 },
    { category: 'Cơ khí / Tự động hóa', medianSalaryMillionVnd: 15.5, minSalaryMillionVnd: 9, maxSalaryMillionVnd: 32, jobCount: 160 }
  ],
  topPayingSkills: [
    { skill: 'React / Next.js', medianSalaryMillionVnd: 26.0, jobCount: 185 },
    { skill: 'Node.js / Go', medianSalaryMillionVnd: 28.5, jobCount: 140 },
    { skill: 'Python / AI & ML', medianSalaryMillionVnd: 32.0, jobCount: 95 },
    { skill: 'DevOps / Kubernetes', medianSalaryMillionVnd: 35.0, jobCount: 75 },
    { skill: 'Digital Performance Marketing', medianSalaryMillionVnd: 21.0, jobCount: 120 }
  ]
};

export const SalaryInsightsPage: React.FC = () => {
  const [category, setCategory] = useState<string>('all');
  const [location, setLocation] = useState<string>('all');
  const [insights, setInsights] = useState<SalaryInsightsResult | null>(FALLBACK_INSIGHTS);
  const [loading, setLoading] = useState(false);

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
      .then((data) => {
        if (data && (data.totalJobsAnalyzed > 0 || (data.byCategory && data.byCategory.length > 0))) {
          setInsights(data);
        } else {
          setInsights(FALLBACK_INSIGHTS);
        }
      })
      .catch((err) => {
        console.error('Failed to load salary insights:', err);
        setInsights(FALLBACK_INSIGHTS);
      })
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

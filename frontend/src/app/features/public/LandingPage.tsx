import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { SeoHead } from '../../shared/components/SeoHead';
import { SearchBar } from '../../shared/components/search/SearchBar';
import { JobCard } from '../../shared/components/cards/JobCard';
import { jobsService } from '../../core/services/jobs.service';
import { companiesService } from '../../core/services/companies.service';
import { articlesService, type ArticleSummary } from '../../core/services/articles.service';
import { salaryInsightsService, type SalaryInsightsResult } from '../../core/services/salary-insights.service';
import {
  metaService,
  type ProvinceItem,
  type IndustryItem,
  STATIC_PROVINCES,
  STATIC_INDUSTRIES
} from '../../core/services/meta.service';
import type { JobDto } from '../../core/models/job.model';
import type { CompanyDto } from '../../core/models/company.model';
import styles from './LandingPage.module.scss';

export const LandingPage: React.FC = () => {
  // Reference Data
  const [industries, setIndustries] = useState<IndustryItem[]>(STATIC_INDUSTRIES);
  const [provinces, setProvinces] = useState<ProvinceItem[]>(STATIC_PROVINCES);
  const [sortAlphabetical, setSortAlphabetical] = useState(false);

  // Real Counts
  const [totalJobs, setTotalJobs] = useState<number>(0);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);

  // Tabbed Jobs
  const [activeTab, setActiveTab] = useState<'newest' | 'featured' | 'urgent'>('newest');
  const [newestJobs, setNewestJobs] = useState<JobDto[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<JobDto[]>([]);
  const [urgentJobs, setUrgentJobs] = useState<JobDto[]>([]);

  // Companies
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [failedCompanyLogos, setFailedCompanyLogos] = useState<Set<number>>(new Set());

  // Articles & Salary
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [salarySample, setSalarySample] = useState<SalaryInsightsResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Fetch metadata & facets
    metaService.getIndustries().then((data) => {
      if (isMounted && data && data.length > 0) setIndustries(data);
    });
    metaService.getProvinces().then((data) => {
      if (isMounted && data && data.length > 0) setProvinces(data);
    });

    // 2. Fetch Jobs for tabs
    jobsService
      .getJobs({ page: 1, pageSize: 8, sort: 'newest' })
      .then((res) => {
        if (isMounted && res.data?.success && res.data.data) {
          const data = res.data.data;
          setNewestJobs(data.items || []);
          setTotalJobs(data.meta?.total || data.items?.length || 0);
        }
      })
      .catch(() => {});

    jobsService
      .getJobs({ page: 1, pageSize: 8, isFeatured: true })
      .then((res) => {
        if (isMounted && res.data?.success && res.data.data) {
          setFeaturedJobs(res.data.data.items || []);
        }
      })
      .catch(() => {});

    jobsService
      .getJobs({ page: 1, pageSize: 8, isUrgent: true })
      .then((res) => {
        if (isMounted && res.data?.success && res.data.data) {
          setUrgentJobs(res.data.data.items || []);
        }
      })
      .catch(() => {});

    // 3. Fetch Companies
    companiesService
      .getCompanies({ page: 1, pageSize: 8 })
      .then((res) => {
        if (isMounted && res.data?.success && res.data.data) {
          const data = res.data.data;
          setCompanies(data.items || []);
          setTotalCompanies(data.meta?.total || data.items?.length || 0);
        }
      })
      .catch(() => {});

    // 4. Fetch Articles
    articlesService
      .getArticles({ page: 1, pageSize: 3, sortBy: 'newest' })
      .then((res) => {
        if (isMounted && res?.items) {
          setArticles(res.items);
        }
      })
      .catch(() => {});

    // 5. Fetch Salary Insights sample
    salaryInsightsService
      .getSalaryInsights('cong-nghe-thong-tin')
      .then((res) => {
        if (isMounted && res && res.totalJobsAnalyzed >= 5) {
          setSalarySample(res);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter industries to display
  const displayedIndustries = [...industries].sort((a, b) => {
    if (sortAlphabetical) {
      return a.name.localeCompare(b.name, 'vi');
    }
    return (b.jobCount || 0) - (a.jobCount || 0);
  });

  // 6 Central Cities
  const centralCities = provinces.filter((p) => p.type === 'city');

  // Active jobs to display in grid
  const currentJobs =
    activeTab === 'featured'
      ? featuredJobs
      : activeTab === 'urgent'
        ? urgentJobs
        : newestJobs;

  return (
    <div className={styles.page}>
      <SeoHead
        title="HR Portal — Bảng Tin Việc Làm & Tuyển Dụng Nhân Sự Toàn Quốc"
        description="Tìm kiếm việc làm minh bạch, cập nhật liên tục từ doanh nghiệp uy tín trên toàn quốc. Tra cứu lương theo ngành nghề và địa điểm."
        keywords="việc làm, tuyển dụng, tìm việc làm, bảng tin tuyển dụng, HR portal, báo cáo lương"
      />

      {/* 1. Dải tìm kiếm nền trắng */}
      <section className={styles.searchStrip}>
        <div className="container-public">
          <div className={styles.searchHeader}>
            <h1 className={styles.searchTitle}>Tìm việc làm trên toàn quốc</h1>
            <p className={styles.searchSubtitle}>
              Khám phá các vị trí tuyển dụng mới nhất được xác thực từ doanh nghiệp
            </p>
          </div>

          <SearchBar />

          <div className={styles.searchMetaRow}>
            {/* Dòng gợi ý tìm nhiều */}
            <div className={styles.popularTags}>
              <span className={styles.popularLabel}>Tìm nhiều:</span>
              {industries.slice(0, 5).map((ind) => (
                <Link
                  key={ind.code}
                  to={`/jobs?industry=${encodeURIComponent(ind.code)}`}
                  className={styles.popularTagLink}
                >
                  {ind.name.split('/')[0].trim()}
                </Link>
              ))}
            </div>

            {/* Dòng số thật (chỉ hiện khi có ít nhất 20 việc) */}
            {totalJobs >= 20 && (
              <div className={styles.statsNote}>
                Đang có <strong>{totalJobs.toLocaleString()}</strong> việc làm từ{' '}
                <strong>{totalCompanies > 0 ? totalCompanies.toLocaleString() : 'hàng trăm'}</strong> công ty.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Tab Việc làm mới | Nổi bật | Tuyển gấp */}
      <section className={styles.section}>
        <div className="container-public">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>Cơ hội nghề nghiệp đang mở</h2>
            </div>

            <div className={styles.tabsRow} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'newest'}
                className={`${styles.tabBtn} ${activeTab === 'newest' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('newest')}
              >
                Mới nhất
              </button>

              {featuredJobs.length > 0 && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'featured'}
                  className={`${styles.tabBtn} ${activeTab === 'featured' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('featured')}
                >
                  Nổi bật ({featuredJobs.length})
                </button>
              )}

              {urgentJobs.length > 0 && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'urgent'}
                  className={`${styles.tabBtn} ${activeTab === 'urgent' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('urgent')}
                >
                  Tuyển gấp ({urgentJobs.length})
                </button>
              )}
            </div>
          </div>

          <div className={styles.jobsGrid}>
            {currentJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          <div className={styles.sectionFooter}>
            <Link to="/jobs" className={styles.viewAllBtn}>
              Xem tất cả việc làm <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Việc làm theo ngành nghề (danh sách chữ 4 cột) */}
      <section className={styles.section}>
        <div className="container-public">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Việc làm theo ngành nghề</h2>
            <button
              type="button"
              className={styles.sortToggleBtn}
              onClick={() => setSortAlphabetical(!sortAlphabetical)}
            >
              {sortAlphabetical ? 'Sắp xếp theo số lượng tin' : 'Xem theo bảng chữ cái'}
            </button>
          </div>

          <ul className={styles.industriesList}>
            {displayedIndustries.map((ind) => (
              <li key={ind.code}>
                <Link
                  to={`/jobs?industry=${encodeURIComponent(ind.code)}`}
                  className={styles.industryItem}
                >
                  <span>{ind.name}</span>
                  {ind.jobCount !== undefined && ind.jobCount > 0 && (
                    <span className={styles.locationCount}>{ind.jobCount}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. Việc làm theo địa điểm (6 thành phố trung ương) */}
      <section className={styles.section}>
        <div className="container-public">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Việc làm theo địa điểm trọng điểm</h2>
            <Link to="/jobs" className={styles.sortToggleBtn}>
              Xem tất cả 34 tỉnh, thành →
            </Link>
          </div>

          <div className={styles.locationsGrid}>
            {centralCities.map((city) => (
              <Link
                key={city.code}
                to={`/jobs?province=${encodeURIComponent(city.code)}`}
                className={styles.locationCard}
              >
                <h3 className={styles.locationName}>{city.name}</h3>
                <span className={styles.locationCount}>
                  {city.jobCount ? `${city.jobCount} việc làm` : 'Xem việc làm'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Công ty đang tuyển */}
      {companies.length > 0 && (
        <section className={styles.section}>
          <div className="container-public">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Doanh nghiệp đang tuyển dụng</h2>
              <Link to="/companies" className={styles.sortToggleBtn}>
                Tất cả công ty →
              </Link>
            </div>

            <div className={styles.companiesGrid}>
              {companies.map((comp) => {
                const initial = comp.name.trim().charAt(0).toUpperCase() || 'C';
                return (
                  <Link
                    key={comp.id}
                    to={`/companies/${comp.id}`}
                    className={styles.companyCard}
                  >
                    {comp.logoUrl && !failedCompanyLogos.has(comp.id) ? (
                      <img
                        src={comp.logoUrl}
                        alt={comp.name}
                        className={styles.companyLogo}
                        onError={() => {
                          setFailedCompanyLogos((prev) => new Set(prev).add(comp.id));
                        }}
                      />
                    ) : (
                      <span className={styles.companyInitial}>{initial}</span>
                    )}

                    <div className={styles.companyInfo}>
                      <h3 className={styles.companyCardName} title={comp.name}>
                        {comp.name}
                      </h3>
                      <p className={styles.companyCardMeta}>
                        {comp.industry || 'Doanh nghiệp'}
                      </p>
                      {comp.activeJobsCount !== undefined && comp.activeJobsCount > 0 && (
                        <span className={styles.companyJobBadge}>
                          {comp.activeJobsCount} việc đang tuyển
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 6. Hai lối vào chia đôi bằng đường kẻ dọc */}
      <section className={styles.section}>
        <div className="container-public">
          <div className={styles.dualEntranceCard}>
            <div className={styles.dualCol}>
              <div>
                <h3 className={styles.dualColTitle}>Dành Cho Ứng Viên</h3>
                <p className={styles.dualColText}>
                  Tạo hồ sơ trực tuyến, tìm kiếm việc làm minh bạch và nhận phân tích mức độ tương thích kỹ năng với từng vị trí tuyển dụng.
                </p>
              </div>
              <Link to="/jobs" className={styles.dualColBtn}>
                Tìm việc ngay <ChevronRight size={15} />
              </Link>
            </div>

            <div className={styles.dualDivider} />

            <div className={styles.dualCol}>
              <div>
                <h3 className={styles.dualColTitle}>Dành Cho Nhà Tuyển Dụng</h3>
                <p className={styles.dualColText}>
                  Đăng tin tuyển dụng nhanh chóng, tiếp cận ứng viên tiềm năng và quản lý quy trình xét duyệt hồ sơ trên một hệ thống tập trung.
                </p>
              </div>
              <Link to="/pricing" className={styles.dualColBtnSecondary}>
                Xem bảng giá đăng tin <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Cẩm nang & Số liệu lương */}
      {(articles.length > 0 || salarySample) && (
        <section className={styles.section}>
          <div className="container-public">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Thông tin thị trường & Nghề nghiệp</h2>
            </div>

            <div className={styles.articlesRow}>
              {/* Articles 3 items */}
              <div className={styles.articlesList}>
                {articles.map((art) => (
                  <Link
                    key={art.id}
                    to={`/blog/${art.slug}`}
                    className={styles.articleItem}
                  >
                    <h3 className={styles.articleTitle}>{art.title}</h3>
                    <div className={styles.articleMeta}>
                      <span>{art.category}</span>
                      <span>•</span>
                      <span>{new Date(art.publishedAt).toLocaleDateString('vi-VN')}</span>
                      {art.readingTimeMinutes && (
                        <>
                          <span>•</span>
                          <span>{art.readingTimeMinutes} phút đọc</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Salary Snippet if sample count >= 5 */}
              {salarySample && (
                <div className={styles.salaryWidget}>
                  <div>
                    <h3 className={styles.salaryWidgetTitle}>Mức lương tham chiếu</h3>
                    <span className={styles.salaryWidgetSample}>
                      Ngành: Công nghệ thông tin (Cỡ mẫu: {salarySample.totalJobsAnalyzed} tin)
                    </span>
                    <div className={styles.salaryWidgetAmount}>
                      {salarySample.overallMedianMillionVnd} triệu
                    </div>
                    <p className={styles.searchSubtitle}>
                      Mức lương trung vị được tổng hợp từ dữ liệu tin tuyển dụng thực tế.
                    </p>
                  </div>
                  <Link to="/salary-insights" className={styles.sortToggleBtn}>
                    Tra cứu báo cáo lương chi tiết →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 8. Dải nhà tuyển dụng */}
      <section className={styles.employerStrip}>
        <div className="container-public">
          <div className={styles.employerStripContainer}>
            <p className={styles.employerStripText}>
              Doanh nghiệp của bạn đang tìm kiếm nhân sự chất lượng cao? Đăng tin ngay hôm nay.
            </p>
            <Link to="/pricing" className={styles.employerStripBtn}>
              Xem bảng giá dịch vụ <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

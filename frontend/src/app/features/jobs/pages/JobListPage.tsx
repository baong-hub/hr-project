import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Sparkles, SlidersHorizontal, Inbox } from 'lucide-react';
import { jobsService } from '../../../core/services/jobs.service';
import { applicationsService } from '../../../core/services/applications.service';
import { cvsService } from '../../../core/services/cvs.service';
import { savedJobService } from '../../../core/services/saved-job.service';
import { authService } from '../../../core/services/auth.service';
import { metaService, type ProvinceItem, type IndustryItem } from '../../../core/services/meta.service';
import { aiService, type JobRecommendationResult } from '../../../core/services/ai.service';
import { toast } from '../../../core/services/toast.service';
import type { JobDto } from '../../../core/models/job.model';
import { SearchBar } from '../../../shared/components/search/SearchBar';
import { JobCard } from '../../../shared/components/cards/JobCard';
import { JobFilters, type JobFacetsData } from '../components/JobFilters';
import { ActiveFilterChips, type ActiveFiltersState } from '../components/ActiveFilterChips';
import { JobDetailPane } from '../components/JobDetailPane';
import { JobListSkeleton } from '../components/JobListSkeleton';
import { ApplyJobModal } from '../components/ApplyJobModal';
import styles from './JobListPage.module.scss';

export const JobListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const user = authService.getUser();
  const isAuthenticated = authService.isAuthenticated();
  const roles = (user?.roles as string[]) || [];
  const userRole = user?.role || user?.accountType || '';
  const isEmployer =
    isAuthenticated &&
    (roles.includes('Nhà tuyển dụng') ||
      userRole === 'EMPLOYER' ||
      userRole === 'Company' ||
      userRole === 'Admin' ||
      userRole === 'ADMIN');
  const isCandidate = isAuthenticated && !isEmployer;

  // Reference Metadata
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [industries, setIndustries] = useState<IndustryItem[]>([]);
  const [facets, setFacets] = useState<JobFacetsData | null>(null);

  // Job Listing State
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<JobDto | null>(null);

  // Mobile filters drawer
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Apply Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingJob, setApplyingJob] = useState<JobDto | null>(null);
  const [cvs, setCvs] = useState<any[]>([]);
  const [submittingApply, setSubmittingApply] = useState(false);

  // Saved & Applied Job IDs
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [togglingJobId, setTogglingJobId] = useState<number | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());

  // AI Recommended Jobs
  const [recommendedJobs, setRecommendedJobs] = useState<JobRecommendationResult[]>([]);

  // Parse filters from URL searchParams
  const activeFilters: ActiveFiltersState = useMemo(() => {
    return {
      search: searchParams.get('q') || searchParams.get('keyword') || searchParams.get('search') || '',
      province: searchParams.get('province') || searchParams.get('provinces') || searchParams.get('location') || searchParams.get('city') || '',
      industry: searchParams.get('industry') || searchParams.get('industries') || searchParams.get('category') || '',
      salary: searchParams.get('salary') || searchParams.get('salaryFrom') || '',
      level: searchParams.get('level') || searchParams.get('experienceLevel') || '',
      type: searchParams.get('type') || searchParams.get('employmentType') || '',
      mode: searchParams.get('mode') || searchParams.get('workMode') || '',
      posted: searchParams.get('posted') || searchParams.get('postedWithinDays') || '',
      sort: searchParams.get('sort') || 'newest',
    };
  }, [searchParams]);

  const currentPage = Number(searchParams.get('page')) || 1;

  // Load Reference Metadata
  useEffect(() => {
    Promise.all([metaService.getProvinces(), metaService.getIndustries()])
      .then(([provList, indList]) => {
        setProvinces(provList);
        setIndustries(indList);
      })
      .catch((err) => console.error('Failed to load metadata', err));
  }, []);

  // Fetch Jobs & Facets
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        pageSize: 15,
        sort: activeFilters.sort || 'newest',
      };

      if (activeFilters.search) params.search = activeFilters.search;
      if (activeFilters.province) params.provinces = activeFilters.province;
      if (activeFilters.industry) params.categories = activeFilters.industry;
      if (activeFilters.salary) params.salary = activeFilters.salary;
      if (activeFilters.level) params.experienceLevel = activeFilters.level;
      if (activeFilters.type) params.employmentType = activeFilters.type;
      if (activeFilters.mode) params.workMode = activeFilters.mode;
      if (activeFilters.posted) params.postedWithinDays = Number(activeFilters.posted);

      const [jobsRes, facetsRes] = await Promise.all([
        jobsService.getJobs(params),
        metaService.getJobFacets(params).catch(() => null),
      ]);

      if (jobsRes.data?.success) {
        const pagedData = jobsRes.data.data;
        const items = pagedData?.items || [];
        setJobs(items);
        setTotalJobs(pagedData?.meta?.total ?? items.length);
        setTotalPages(pagedData?.meta?.totalPages ?? Math.max(1, Math.ceil(items.length / 15)));

        if (items.length > 0) {
          // If previous active job still exists in items, preserve it
          const matched = items.find((j: JobDto) => j.id === activeJob?.id);
          setActiveJob(matched || items[0]);
        } else {
          setActiveJob(null);
        }
      } else {
        setError(jobsRes.data?.error?.message || 'Không thể tải danh sách việc làm.');
      }

      if (facetsRes) {
        setFacets(facetsRes);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeFilters, activeJob?.id]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Fetch Saved Jobs for Candidate
  const fetchSavedJobs = async () => {
    if (!isCandidate) return;
    try {
      const res = await savedJobService.getSavedJobs({ page: 1, pageSize: 200 });
      if (res.data?.success && res.data.data?.items) {
        setSavedJobIds(new Set(res.data.data.items.map((item: any) => item.jobId)));
      }
    } catch (err) {
      console.error('Failed to fetch saved jobs:', err);
    }
  };

  // Fetch Applied Jobs for Candidate
  const fetchAppliedJobs = async () => {
    if (!authService.isAuthenticated() || isEmployer) return;
    try {
      const res = await applicationsService.getApplications();
      if (res.data?.success && res.data.data) {
        const raw = res.data.data;
        const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
        setAppliedJobIds(new Set(items.map((item: any) => item.jobId)));
      }
    } catch (err) {
      console.error('Failed to fetch applied jobs:', err);
    }
  };

  // Fetch AI Recommendations for Candidate
  const fetchRecommendations = async () => {
    if (!isCandidate || !authService.isAuthenticated()) return;
    try {
      const res = await aiService.getRecommendedJobs(4);
      if (res.data?.success && res.data.data) {
        setRecommendedJobs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch AI recommended jobs', err);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
    fetchAppliedJobs();
    fetchRecommendations();
  }, [isCandidate]);

  // Filter Management
  const handleFilterChange = (key: keyof ActiveFiltersState, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    // Clean up legacy aliases
    if (key === 'province') {
      next.delete('location');
      next.delete('city');
      next.delete('provinces');
    }
    if (key === 'industry') {
      next.delete('category');
      next.delete('industries');
    }
    if (key === 'search') {
      next.delete('keyword');
      next.delete('q');
      if (value) next.set('q', value);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleClearAllFilters = () => {
    const next = new URLSearchParams();
    if (activeFilters.sort) next.set('sort', activeFilters.sort);
    setSearchParams(next);
  };

  const handleRemoveFilter = (key: keyof ActiveFiltersState) => {
    handleFilterChange(key, '');
  };

  const handleSortChange = (newSort: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('sort', newSort);
    next.set('page', '1');
    setSearchParams(next);
  };

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', newPage.toString());
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle Save Job
  const handleToggleSaveJob = async (jobId: number) => {
    if (!authService.isAuthenticated()) {
      toast.info('Vui lòng đăng nhập để lưu việc làm yêu thích.');
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    if (!isCandidate) {
      toast.error('Chỉ ứng viên mới có thể lưu việc làm.');
      return;
    }

    setTogglingJobId(jobId);
    const wasSaved = savedJobIds.has(jobId);
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(jobId);
      else next.add(jobId);
      return next;
    });

    try {
      const res = await savedJobService.toggleSave(jobId);
      if (res.data?.success && res.data.data) {
        const { isSaved: saved } = res.data.data;
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          if (saved) next.add(jobId);
          else next.delete(jobId);
          return next;
        });
        toast.success(saved ? 'Đã lưu việc làm!' : 'Đã bỏ lưu việc làm.');
      }
    } catch {
      // Rollback
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(jobId);
        else next.delete(jobId);
        return next;
      });
      toast.error('Lỗi khi lưu việc làm.');
    } finally {
      setTogglingJobId(null);
    }
  };

  // Apply Modal Handlers
  const handleOpenApplyModal = (job: JobDto) => {
    if (!authService.isAuthenticated()) {
      toast.info('Vui lòng đăng nhập tài khoản ứng viên để nộp đơn ứng tuyển.');
      navigate(`/auth/login?redirect=${encodeURIComponent('/jobs/' + job.id)}`);
      return;
    }
    if (!isCandidate) {
      toast.error('Chỉ ứng viên mới có thể nộp đơn ứng tuyển.');
      return;
    }
    if (appliedJobIds.has(job.id)) {
      toast.info('Bạn đã ứng tuyển vị trí này rồi.');
      return;
    }

    setApplyingJob(job);
    setShowApplyModal(true);
    cvsService
      .getCvs()
      .then((res) => {
        if (res.success && res.data) {
          setCvs(res.data);
        }
      })
      .catch((err) => console.error(err));
  };

  const handleSubmitApply = async (cvId: number, coverLetter: string) => {
    if (!applyingJob) return;
    setSubmittingApply(true);
    try {
      const res = await applicationsService.submitApplication({
        jobId: applyingJob.id,
        candidateCvId: cvId,
        coverLetter,
      });

      if (res.data?.success) {
        toast.success('Nộp hồ sơ ứng tuyển thành công!');
        setAppliedJobIds((prev) => new Set(prev).add(applyingJob.id));
        setShowApplyModal(false);
        setApplyingJob(null);
      } else {
        toast.error(res.data?.error?.message || 'Ứng tuyển thất bại.');
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error?.message || err?.message || 'Lỗi khi gửi đơn ứng tuyển.';
      toast.error(errMsg);
      if (errMsg.includes('đã nộp đơn') || errMsg.includes('already applied')) {
        setAppliedJobIds((prev) => new Set(prev).add(applyingJob.id));
        setShowApplyModal(false);
      }
    } finally {
      setSubmittingApply(false);
    }
  };

  // Resolve active filter label names
  const activeProvinceName = useMemo(() => {
    if (!activeFilters.province) return undefined;
    const found = provinces.find(
      (p) =>
        p.code.toLowerCase() === activeFilters.province!.toLowerCase() ||
        p.name.toLowerCase() === activeFilters.province!.toLowerCase()
    );
    return found?.name;
  }, [provinces, activeFilters.province]);

  const activeIndustryName = useMemo(() => {
    if (!activeFilters.industry) return undefined;
    const found = industries.find(
      (i) =>
        i.code.toLowerCase() === activeFilters.industry!.toLowerCase() ||
        i.name.toLowerCase() === activeFilters.industry!.toLowerCase()
    );
    return found?.name;
  }, [industries, activeFilters.industry]);

  const activeFilterCount = Object.entries(activeFilters).filter(
    ([k, v]) => k !== 'sort' && Boolean(v?.trim())
  ).length;

  return (
    <div className={styles.jobListPage}>
      {/* Top Search Bar */}
      <section className={styles.searchStrip} aria-label="Tìm kiếm nhanh">
        <SearchBar autoSyncUrl={true} />
      </section>

      {/* Candidate AI Recommendation Bar */}
      {isCandidate && recommendedJobs.length > 0 && (
        <section className={styles.aiRecommendationBar} aria-label="Gợi ý việc làm AI">
          <div className={styles.aiHeader}>
            <div className={styles.aiTitleWrap}>
              <Sparkles size={16} className={styles.aiIcon} />
              <div>
                <h3>Việc làm AI gợi ý cho hồ sơ của bạn</h3>
                <p>Khớp nối tự động từ kỹ năng và kinh nghiệm trên CV</p>
              </div>
            </div>
            <span className={styles.aiTag}>✨ AI Match</span>
          </div>

          <div className={styles.aiGrid}>
            {recommendedJobs.map((rec) => (
              <div
                key={rec.jobId}
                className={styles.aiCard}
                onClick={() => navigate(`/jobs/${rec.jobId}`)}
              >
                <div>
                  <h4 className={styles.aiCardTitle}>{rec.title}</h4>
                  <p className={styles.aiCardCompany}>
                    {rec.companyName} {rec.city ? `• ${rec.city}` : ''}
                  </p>
                  {rec.matchReason && (
                    <p className={styles.aiCardReason}>"{rec.matchReason}"</p>
                  )}
                </div>
                <div className={styles.aiCardFooter}>
                  <span className={styles.aiCardSalary}>
                    {rec.salaryFrom || rec.salaryTo
                      ? `${(rec.salaryFrom ? rec.salaryFrom / 1000000 : 0).toFixed(0)} - ${(rec.salaryTo ? rec.salaryTo / 1000000 : 0).toFixed(0)} triệu`
                      : 'Thỏa thuận'}
                  </span>
                  <span className={styles.aiCardScore}>{rec.matchScore}% phù hợp</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mobile filter toggle */}
      <div className={styles.mobileFilterBar}>
        <button
          type="button"
          className={styles.mobileFilterBtn}
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
        >
          <SlidersHorizontal size={15} />
          <span>Bộ lọc nâng cao</span>
          {activeFilterCount > 0 && (
            <span className={styles.filterBadge}>{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Active Filter Chips & Sort row */}
      <ActiveFilterChips
        totalCount={totalJobs}
        filters={activeFilters}
        provinceName={activeProvinceName}
        industryName={activeIndustryName}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
        sortValue={activeFilters.sort || 'newest'}
        onSortChange={handleSortChange}
      />

      {/* 3-Column / 2-Column Board Grid */}
      <div className={styles.boardGrid}>
        {/* Left: JobFilters Sidebar */}
        <div
          className={`${styles.sidebarWrapper} ${mobileFiltersOpen ? styles.mobileOpen : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileFiltersOpen(false);
          }}
        >
          <JobFilters
            filters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAllFilters}
            provinces={provinces}
            industries={industries}
            facets={facets}
          />
        </div>

        {/* Center: Job Cards Column */}
        <main className={styles.cardListColumn} aria-label="Danh sách tin tuyển dụng">
          {loading ? (
            <JobListSkeleton count={6} />
          ) : error ? (
            <div className={styles.emptyResults}>
              <h3>Đã xảy ra lỗi</h3>
              <p>{error}</p>
              <button
                type="button"
                className={styles.clearFiltersBtn}
                onClick={fetchJobs}
              >
                Thử lại
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className={styles.emptyResults}>
              <Inbox size={40} className={styles.emptyIcon} />
              <h3>Không tìm thấy cơ hội việc làm phù hợp</h3>
              <p>
                Hãy thử điều chỉnh hoặc xóa bớt tiêu chí bộ lọc để xem thêm các cơ hội tuyển dụng khác.
              </p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className={styles.clearFiltersBtn}
                  onClick={handleClearAllFilters}
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          ) : (
            <>
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSelected={activeJob?.id === job.id}
                  isSaved={savedJobIds.has(job.id)}
                  onClick={() => {
                    setActiveJob(job);
                    // On mobile, navigate straight to detail page
                    if (window.innerWidth <= 1024) {
                      navigate(`/jobs/${job.id}`);
                    }
                  }}
                  onToggleSave={() => handleToggleSaveJob(job.id)}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className={styles.pagination} aria-label="Phân trang việc làm">
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    ‹ Trước
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                    let pageNum = idx + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + idx;
                      if (pageNum > totalPages) pageNum = totalPages - 4 + idx;
                    }

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        className={`${styles.pageBtn} ${currentPage === pageNum ? styles.active : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Sau ›
                  </button>
                </nav>
              )}
            </>
          )}
        </main>

        {/* Right: JobDetailPane (Desktop Split Preview) */}
        <div className={styles.detailPaneWrapper}>
          <JobDetailPane
            job={activeJob}
            onApply={handleOpenApplyModal}
            onToggleSave={handleToggleSaveJob}
            isSaved={activeJob ? savedJobIds.has(activeJob.id) : false}
            hasApplied={activeJob ? appliedJobIds.has(activeJob.id) : false}
            togglingSave={activeJob ? togglingJobId === activeJob.id : false}
          />
        </div>
      </div>

      {/* Apply Modal */}
      <ApplyJobModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        job={applyingJob}
        cvs={cvs}
        onSubmit={handleSubmitApply}
        submitting={submittingApply}
      />
    </div>
  );
};

export default JobListPage;

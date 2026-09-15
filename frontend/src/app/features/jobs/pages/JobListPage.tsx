import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Briefcase, DollarSign, Clock, Heart } from 'lucide-react';
import { jobsService } from '../../../core/services/jobs.service';
import { applicationsService } from '../../../core/services/applications.service';
import { cvsService } from '../../../core/services/cvs.service';
import { savedJobService } from '../../../core/services/saved-job.service';
import { authService } from '../../../core/services/auth.service';
import { toast } from '../../../core/services/toast.service';
import type { JobDto } from '../../../core/models/job.model';
import { CITY_OPTIONS } from '../../../core/utils/city.utils';
import styles from './JobsPage.module.scss';

export const JobListPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = authService.getUser();
  const roles = (user?.roles as string[]) || [];
  const userRole = user?.role || user?.accountType || '';
  const isEmployer = roles.includes('Nhà tuyển dụng') || userRole === 'EMPLOYER' || userRole === 'Company' || userRole === 'Admin' || userRole === 'ADMIN';
  const isCandidate = !isEmployer;

  // State
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<JobDto | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [salaryFrom, setSalaryFrom] = useState('');

  // Apply Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingJob, setApplyingJob] = useState<JobDto | null>(null);
  const [cvs, setCvs] = useState<any[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<number | ''>('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);

  // Saved Jobs
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [togglingJobId, setTogglingJobId] = useState<number | null>(null);

  // Applied Jobs (prevent duplicate applications)
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());

  // Track job view impressions for accurate analytics
  useEffect(() => {
    if (activeJob?.id) {
      jobsService.trackJobView(activeJob.id).catch(() => {});
    }
  }, [activeJob?.id]);

  const fetchJobs = async (overrideParams?: { search?: string; city?: string; salaryFrom?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const s = overrideParams?.search !== undefined ? overrideParams.search : search;
      const c = overrideParams?.city !== undefined ? overrideParams.city : cityFilter;
      const sal = overrideParams?.salaryFrom !== undefined ? overrideParams.salaryFrom : salaryFrom;

      const params: any = {};
      if (s) params.search = s.trim();
      if (c) params.city = c;
      if (sal) params.salaryFrom = parseFloat(sal);

      // Candidate or public only retrieves PUBLISHED jobs
      const res = await jobsService.getJobs(params);
      if (res.data?.success) {
        const items = res.data.data?.items || [];
        setJobs(items);
        if (items.length > 0) {
          setActiveJob(items[0]);
        } else {
          setActiveJob(null);
        }
      } else {
        setError(res.data?.error?.message || 'Không thể tải danh sách tin tuyển dụng.');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

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

  const toggleSaveJob = async (jobId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCandidate) {
      toast.error('Chỉ ứng viên mới có thể lưu việc làm.');
      return;
    }
    setTogglingJobId(jobId);
    // Optimistic update
    const wasSaved = savedJobIds.has(jobId);
    setSavedJobIds(prev => {
      const next = new Set(prev);
      if (wasSaved) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
    try {
      const res = await savedJobService.toggleSave(jobId);
      if (res.data?.success && res.data.data) {
        const { isSaved } = res.data.data;
        setSavedJobIds(prev => {
          const next = new Set(prev);
          if (isSaved) next.add(jobId);
          else next.delete(jobId);
          return next;
        });
        toast.success(isSaved ? 'Đã lưu việc làm!' : 'Đã bỏ lưu việc làm.');
      }
    } catch (err) {
      // Rollback on error
      setSavedJobIds(prev => {
        const next = new Set(prev);
        if (wasSaved) next.add(jobId);
        else next.delete(jobId);
        return next;
      });
      toast.error('Lỗi khi lưu việc làm. Vui lòng thử lại.');
    } finally {
      setTogglingJobId(null);
    }
  };

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

  useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
    fetchAppliedJobs();
  }, []);

  const handleClearFilters = () => {
    setSearch('');
    setCityFilter('');
    setSalaryFrom('');
    fetchJobs({ search: '', city: '', salaryFrom: '' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const fetchCvs = async () => {
    if (!isCandidate) return;
    try {
      const res = await cvsService.getCvs();
      if (res.success && res.data) {
        const list = res.data || [];
        setCvs(list);
        const main = list.find((c: any) => c.isMain);
        if (main) {
          setSelectedCvId(main.id);
        } else if (list.length > 0) {
          setSelectedCvId(list[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openApplyModal = (job: JobDto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCandidate) {
      toast.error('Chỉ ứng viên mới có thể nộp đơn ứng tuyển.');
      return;
    }
    if (appliedJobIds.has(job.id)) {
      toast.info('Bạn đã ứng tuyển vị trí này rồi. Vui lòng theo dõi tiến độ tại mục Lịch sử ứng tuyển.');
      return;
    }
    setApplyingJob(job);
    setShowApplyModal(true);
    fetchCvs();
  };

  const handleApply = async () => {
    if (!selectedCvId) {
      toast.error('Vui lòng chọn CV để ứng tuyển.');
      return;
    }
    setSubmittingApply(true);
    try {
      const res = await applicationsService.submitApplication({
        jobId: applyingJob!.id,
        candidateCvId: Number(selectedCvId),
        coverLetter
      });
      if (res.data?.success) {
        toast.success('Ứng tuyển thành công!');
        // Mark this job as applied
        setAppliedJobIds(prev => new Set(prev).add(applyingJob!.id));
        setShowApplyModal(false);
        setCoverLetter('');
        setApplyingJob(null);
      } else {
        toast.error(res.data?.error?.message || 'Ứng tuyển thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.error?.message || err?.message || 'Lỗi khi gửi đơn ứng tuyển.';
      toast.error(errMsg);
      if (errMsg.includes('đã nộp đơn') || errMsg.includes('already applied')) {
        if (applyingJob) {
          setAppliedJobIds(prev => new Set(prev).add(applyingJob.id));
        }
        setShowApplyModal(false);
      }
    } finally {
      setSubmittingApply(false);
    }
  };

  const formatSalary = (from?: number, to?: number) => {
    if (!from && !to) return t('jobs.salary_negotiable', 'Thỏa thuận');
    const isEn = i18n.language === 'en';
    const unit = isEn ? 'M VND' : ' triệu';
    const fmt = (n: number) => (n / 1000000).toFixed(0) + unit;
    if (from && to) return `${(from / 1000000).toFixed(0)} - ${fmt(to)}`;
    if (from) return (isEn ? `From ` : `Từ `) + fmt(from);
    return (isEn ? `Up to ` : `Đến `) + fmt(to!);
  };

  return (
    <div className={styles.jobsPage}>
      <div className={styles.titleArea}>
        <div>
          <h1>{t('jobs.title', 'Khám phá Cơ hội Việc làm IT')}</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
            {t('jobs.subtitle', 'Tìm kiếm và ứng tuyển trực tiếp nhanh chóng')}
          </p>
        </div>
        {!isCandidate && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              onClick={() => navigate('/employer/jobs')}
              className={styles.btnSecondary}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {t('jobs.manage_my_jobs', 'Quản lý tin của tôi')}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/employer/jobs/new')}
              className={styles.btnPrimary}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {t('jobs.post_new_job', '+ Đăng tin mới')}
            </button>
          </div>
        )}
      </div>

      {/* Candidate Fast-Track Notification Banner */}
      {isCandidate && (
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
          borderRadius: '10px',
          padding: '12px 18px',
          color: '#ffffff',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 10px rgba(5, 150, 105, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem' }}>
              <strong>{t('jobs.candidate_zone', 'Khu vực Ứng viên')}:</strong> {t('jobs.candidate_zone_desc', 'Theo dõi tiến độ hồ sơ, Thư mời nhận việc (Job Offers) và các bài kiểm tra năng lực của bạn.')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => navigate('/candidate/offers')}
              style={{ padding: '6px 12px', borderRadius: '6px', background: '#ffffff', color: '#065f46', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {t('jobs.btn_offers', 'Thư mời nhận việc')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/candidate/applications')}
              style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {t('jobs.btn_app_history', 'Lịch sử ứng tuyển')}
            </button>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <form onSubmit={handleSearchSubmit} className={styles.jobSearchBox}>
        <div className={styles.searchInputs} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <input
            type="text"
            placeholder={t('jobs.search_placeholder', 'Tìm theo tiêu đề công việc, kỹ năng...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            value={cityFilter} 
            onChange={(e) => {
              const val = e.target.value;
              setCityFilter(val);
              fetchJobs({ city: val });
            }}
          >
            {CITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.value === '' ? t('jobs.all_locations', opt.label) : opt.label}
              </option>
            ))}
          </select>
          <select 
            value={salaryFrom} 
            onChange={(e) => {
              const val = e.target.value;
              setSalaryFrom(val);
              fetchJobs({ salaryFrom: val });
            }}
          >
            <option value="">{t('jobs.all_salaries', 'Tất cả mức lương')}</option>
            <option value="10000000">{i18n.language === 'en' ? 'Above 10M VND' : 'Trên 10 triệu'}</option>
            <option value="20000000">{i18n.language === 'en' ? 'Above 20M VND' : 'Trên 20 triệu'}</option>
            <option value="30000000">{i18n.language === 'en' ? 'Above 30M VND' : 'Trên 30 triệu'}</option>
            <option value="40000000">{i18n.language === 'en' ? 'Above 40M VND' : 'Trên 40 triệu'}</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '12px' }}>
          <button type="submit" className={styles.btnPrimary}>
            {t('jobs.btn_search', 'Tìm kiếm')}
          </button>
          <button type="button" onClick={handleClearFilters} className={styles.btnSecondary}>
            {t('jobs.btn_clear_filter', 'Xóa bộ lọc')}
          </button>
        </div>
      </form>

      {/* Main Content (Split Layout) */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          {t('common.loading', 'Đang tải danh sách công việc...')}
        </div>
      ) : error ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-error)' }}>
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          {t('jobs.no_jobs_found', 'Không tìm thấy cơ hội việc làm nào phù hợp.')}
        </div>
      ) : (
        <div className={styles.jobBoardLayout}>
          {/* Left Column: Job Cards */}
          <div className={styles.jobListColumn}>
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`${styles.jobCard} ${activeJob?.id === job.id ? styles.jobCardActive : ''}`}
                onClick={() => setActiveJob(job)}
              >
                <div className={styles.companyBadge}>
                  {job.companyLogoUrl ? (
                    <img src={job.companyLogoUrl} alt="Logo" className={styles.companyLogo} />
                  ) : (
                    <div className={styles.companyLogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-subtle)', fontSize: '10px' }}>No Logo</div>
                  )}
                  <span className={styles.companyName}>{job.companyName}</span>
                </div>
                <h3 className={styles.jobTitle}>{job.title}</h3>
                <div className={styles.jobMetaRow}>
                  <div className={styles.metaItem}>
                    <MapPin size={12} /> {job.city}
                  </div>
                  <div className={styles.metaItem}>
                    <DollarSign size={12} />{' '}
                    <span className={styles.salaryText}>{formatSalary(job.salaryFrom, job.salaryTo)}</span>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <span>{t('jobs.deadline', { date: new Date(job.expiredAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'vi-VN'), defaultValue: `Hạn nộp: ${new Date(job.expiredAt).toLocaleDateString('vi-VN')}` })}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isCandidate && (
                      <button
                        onClick={(e) => toggleSaveJob(job.id, e)}
                        title={savedJobIds.has(job.id) ? t('jobs.btn_saved', 'Đã lưu') : t('jobs.btn_save', 'Lưu việc làm')}
                        disabled={togglingJobId === job.id}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          transform: togglingJobId === job.id ? 'scale(0.85)' : 'scale(1)',
                          opacity: togglingJobId === job.id ? 0.5 : 1,
                        }}
                      >
                        <Heart
                          size={18}
                          fill={savedJobIds.has(job.id) ? '#ef4444' : 'none'}
                          color={savedJobIds.has(job.id) ? '#ef4444' : 'var(--color-text-secondary)'}
                          style={{ transition: 'all 0.2s ease' }}
                        />
                      </button>
                    )}
                    {isCandidate && (
                      appliedJobIds.has(job.id) ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            fontSize: '11px',
                            borderRadius: 'var(--radius-sm)',
                            background: '#ecfdf5',
                            color: '#059669',
                            fontWeight: 600,
                            border: '1px solid #a7f3d0',
                          }}
                        >
                          {t('jobs.btn_applied', 'Đã ứng tuyển')}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => openApplyModal(job, e)}
                          className={styles.btnPrimary}
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: 'var(--radius-sm)' }}
                        >
                          {t('jobs.btn_apply_now', 'Ứng tuyển')}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Quick View Panel */}
          <div className={styles.jobDetailColumn}>
            {activeJob ? (
              <>
                <div className={styles.detailHeader}>
                  <span className={styles.companyName} style={{ fontSize: '14px', fontWeight: 600 }}>
                    {activeJob.companyName}
                  </span>
                  <h2 className={styles.detailHeaderTitle}>{activeJob.title}</h2>
                  <div className={styles.detailHeaderMeta}>
                    <div className={styles.metaItem}>
                      <MapPin size={14} /> {activeJob.city}
                    </div>
                    <div className={styles.metaItem}>
                      <DollarSign size={14} />{' '}
                      <span className={styles.salaryText} style={{ fontSize: '14px' }}>
                        {formatSalary(activeJob.salaryFrom, activeJob.salaryTo)}
                      </span>
                    </div>
                    <div className={styles.metaItem}>
                      <Clock size={14} /> {t('jobs.deadline', { date: new Date(activeJob.expiredAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'vi-VN'), defaultValue: `Hạn nộp: ${new Date(activeJob.expiredAt).toLocaleDateString('vi-VN')}` })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {isCandidate && (
                      appliedJobIds.has(activeJob.id) ? (
                        <button
                          disabled
                          className={styles.btnSecondary}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: '#ecfdf5',
                            color: '#059669',
                            borderColor: '#a7f3d0',
                            fontWeight: 600,
                            cursor: 'not-allowed',
                            opacity: 0.9,
                          }}
                        >
                          {t('jobs.btn_applied', 'Đã ứng tuyển')}
                        </button>
                      ) : (
                        <button onClick={(e) => openApplyModal(activeJob, e)} className={styles.btnPrimary}>
                          {t('jobs.btn_apply_now', 'Ứng tuyển ngay')}
                        </button>
                      )
                    )}
                    {isCandidate && (
                      <button
                        onClick={(e) => toggleSaveJob(activeJob.id, e)}
                        className={styles.btnSecondary}
                        disabled={togglingJobId === activeJob.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: savedJobIds.has(activeJob.id) ? '#ef4444' : undefined,
                          borderColor: savedJobIds.has(activeJob.id) ? '#fecaca' : undefined,
                          background: savedJobIds.has(activeJob.id) ? '#fef2f2' : undefined,
                          fontWeight: 600,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {savedJobIds.has(activeJob.id) ? t('jobs.btn_saved', 'Đã lưu') : t('jobs.btn_save', 'Lưu việc làm')}
                      </button>
                    )}
                    <button onClick={() => navigate(`/jobs/${activeJob.id}`, { state: { fromQuickView: true } })} className={styles.btnSecondary}>
                      {t('jobs.view_full', 'Xem chi tiết đầy đủ')}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/companies/${activeJob.companyId || 1}/careers`)}
                      className={styles.btnSecondary}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: 'var(--color-brand-primary, #4f46e5)',
                        borderColor: 'var(--color-border-default)',
                        background: 'var(--color-bg-subtle, #eef2ff)',
                        fontWeight: 600
                      }}
                      title="Xem ảnh văn phòng, video văn hóa & quyền lợi đặc quyền của công ty này"
                    >
                      {t('jobs.careers_page', 'Cổng Careers Công Ty')}
                    </button>
                  </div>
                </div>
                <div className={styles.detailBody}>
                  <div className={styles.detailSection}>
                    <h3>{t('jobs.job_desc', 'Mô tả công việc')}</h3>
                    <p>{activeJob.description}</p>
                  </div>
                  <div className={styles.detailSection}>
                    <h3>{t('jobs.job_req', 'Yêu cầu ứng viên')}</h3>
                    <p>{activeJob.requirements}</p>
                  </div>
                  {activeJob.benefits && (
                    <div className={styles.detailSection}>
                      <h3>{t('jobs.job_benefits', 'Quyền lợi phúc lợi')}</h3>
                      <p>{activeJob.benefits}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.noJobSelected}>
                <Briefcase size={48} />
                <p>{t('jobs.select_job_to_view', 'Chọn một công việc để xem chi tiết')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ padding: '24px', gap: '16px' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Ứng tuyển: {applyingJob?.title}</h2>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: '6px', fontWeight: 600 }}>Chọn hồ sơ CV</label>
              {cvs.length === 0 ? (
                <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}>Bạn chưa có CV nào trong hệ thống. Vui lòng tạo CV trước.</p>
              ) : (
                <select value={selectedCvId} onChange={(e) => setSelectedCvId(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)' }}>
                  {cvs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.cvTitle} {c.isMain ? '(CV chính)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: '6px', fontWeight: 600 }}>Thư giới thiệu (Cover Letter)</label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Giới thiệu bản thân và lý do bạn phù hợp với công việc này..."
                style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)', fontSize: 'var(--font-size-sm)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button onClick={() => setShowApplyModal(false)} className={styles.btnSecondary}>Hủy</button>
              <button onClick={handleApply} disabled={submittingApply || !selectedCvId} className={styles.btnPrimary}>
                {submittingApply ? 'Đang gửi...' : 'Nộp hồ sơ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

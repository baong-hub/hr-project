import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  CheckCircle,
  Share2,
  Bookmark,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { jobsService } from '../../../core/services/jobs.service';
import { cvsService } from '../../../core/services/cvs.service';
import { applicationsService } from '../../../core/services/applications.service';
import { savedJobService } from '../../../core/services/saved-job.service';
import { authService } from '../../../core/services/auth.service';
import { aiService, type JobFitAnalysisResult } from '../../../core/services/ai.service';
import { toast } from '../../../core/services/toast.service';
import type { JobDto } from '../../../core/models/job.model';
import { SeoHead } from '../../../shared/components/SeoHead';
import { ApplyJobModal } from '../components/ApplyJobModal';
import { AiJobFitModal } from '../components/AiJobFitModal';
import styles from './JobDetailPage.module.scss';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Job data
  const [job, setJob] = useState<JobDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [similarJobs, setSimilarJobs] = useState<JobDto[]>([]);
  const [imgError, setImgError] = useState(false);

  // Apply Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [cvs, setCvs] = useState<any[]>([]);
  const [submittingApply, setSubmittingApply] = useState(false);

  // AI Fit Modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<JobFitAnalysisResult | null>(null);

  // Saved & Applied status
  const [isSaved, setIsSaved] = useState(false);
  const [togglingSave, setTogglingSave] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Fetch Job details
  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await jobsService.getJobById(Number(id));
        if (res.data?.success && res.data.data) {
          const jobData = res.data.data;
          setJob(jobData);
          jobsService.trackJobView(Number(id)).catch(() => {});

          // Fetch similar jobs in same category or province
          const categoryQuery = jobData.categoryCode || jobData.category;
          if (categoryQuery) {
            jobsService
              .getJobs({ categories: categoryQuery, pageSize: 5 })
              .then((simRes) => {
                if (simRes.data?.success && simRes.data.data?.items) {
                  const filtered = simRes.data.data.items
                    .filter((j: JobDto) => j.id !== Number(id))
                    .slice(0, 4);
                  setSimilarJobs(filtered);
                }
              })
              .catch(() => {});
          }
        } else {
          setError(res.data?.error?.message || 'Không tìm thấy tin tuyển dụng yêu cầu.');
        }
      } catch (err) {
        console.error(err);
        setError('Lỗi kết nối máy chủ. Không thể tải chi tiết công việc.');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  // Check saved and applied status for candidates
  useEffect(() => {
    if (!isAuthenticated || isEmployer || !id) return;

    // Saved status
    savedJobService
      .getSavedJobs({ page: 1, pageSize: 200 })
      .then((res) => {
        if (res.data?.success && res.data.data) {
          const raw = res.data.data;
          const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
          setIsSaved(items.some((item: any) => item.jobId === Number(id)));
        }
      })
      .catch(() => {});

    // Applied status
    applicationsService
      .getApplications()
      .then((res) => {
        if (res.data?.success && res.data.data) {
          const raw = res.data.data;
          const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
          setHasApplied(items.some((item: any) => item.jobId === Number(id)));
        }
      })
      .catch(() => {});
  }, [id, isAuthenticated, isEmployer]);

  const formatSalary = (from?: number, to?: number) => {
    if (!from && !to) return 'Thỏa thuận';
    const fmt = (n: number) => (n / 1000000).toFixed(0) + ' triệu';
    if (from && to) return `${fmt(from)} - ${fmt(to)}`;
    if (from) return `Từ ${fmt(from)}`;
    return `Đến ${fmt(to!)}`;
  };

  const getDaysRemainingText = (expiredAt?: string) => {
    if (!expiredAt) return 'Đang tuyển';
    const target = new Date(expiredAt).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Đã hết hạn';
    if (diffDays === 0) return 'Hết hạn hôm nay';
    return `Còn ${diffDays} ngày (hạn: ${new Date(expiredAt).toLocaleDateString('vi-VN')})`;
  };

  // Toggle Save Job
  const handleToggleSaveJob = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập tài khoản ứng viên để lưu việc làm.');
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (!job || !isCandidate) return;

    setTogglingSave(true);
    const wasSaved = isSaved;
    setIsSaved(!wasSaved);

    try {
      const res = await savedJobService.toggleSave(job.id);
      if (res.data?.success && res.data.data) {
        setIsSaved(res.data.data.isSaved);
        toast.success(res.data.data.isSaved ? 'Đã lưu việc làm!' : 'Đã bỏ lưu việc làm.');
      }
    } catch {
      setIsSaved(wasSaved);
      toast.error('Lỗi khi lưu việc làm.');
    } finally {
      setTogglingSave(false);
    }
  };

  // Share Job Link
  const handleShareJob = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết việc làm vào bộ nhớ tạm!');
    } else {
      toast.info(window.location.href);
    }
  };

  // Open Apply Modal
  const handleOpenApplyModal = () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập tài khoản ứng viên để nộp đơn ứng tuyển.');
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (isEmployer) {
      toast.error('Tài khoản nhà tuyển dụng không thể nộp đơn ứng tuyển.');
      return;
    }

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

  // Submit Apply
  const handleSubmitApply = async (cvId: number, coverLetter: string) => {
    if (!job) return;
    setSubmittingApply(true);
    try {
      const res = await applicationsService.submitApplication({
        jobId: job.id,
        candidateCvId: cvId,
        coverLetter,
      });

      if (res.data?.success) {
        toast.success('Ứng tuyển thành công!');
        setHasApplied(true);
        setShowApplyModal(false);
      } else {
        toast.error(res.data?.error?.message || 'Ứng tuyển thất bại.');
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error?.message || err?.message || 'Lỗi khi gửi đơn ứng tuyển.';
      toast.error(errMsg);
      if (errMsg.includes('đã nộp đơn') || errMsg.includes('already applied')) {
        setHasApplied(true);
        setShowApplyModal(false);
      }
    } finally {
      setSubmittingApply(false);
    }
  };

  // Analyze Job Fit with AI
  const handleAnalyzeJobFit = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để AI phân tích độ phù hợp giữa hồ sơ và công việc.');
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (!job) return;

    setShowAiModal(true);
    setAnalyzingAi(true);
    try {
      const res = await aiService.analyzeJobFit(job.id);
      if (res.data?.success && res.data.data) {
        setAiAnalysis(res.data.data);
      } else {
        toast.error(res.data?.error?.message || 'Không thể phân tích độ phù hợp.');
      }
    } catch {
      toast.error('Lỗi khi kết nối với Trợ lý AI.');
    } finally {
      setAnalyzingAi(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.jobDetailPage}>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary, #475569)' }}>
          Đang tải thông tin chi tiết công việc...
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className={styles.jobDetailPage}>
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-error, #dc2626)', marginBottom: '16px' }}>
            {error || 'Công việc không tồn tại.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className={styles.mainApplyBtn}
            style={{ width: 'auto', display: 'inline-flex', padding: '8px 20px' }}
          >
            Quay lại danh sách việc làm
          </button>
        </div>
      </div>
    );
  }

  const initial = job.companyName ? job.companyName.trim().charAt(0).toUpperCase() : 'C';

  // Schema.org JobPosting JSON-LD
  const jobPostingJsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: `${job.description}${job.requirements ? `\n\nYêu cầu công việc:\n${job.requirements}` : ''}`,
    identifier: {
      '@type': 'PropertyValue',
      name: 'HR Portal',
      value: job.id.toString(),
    },
    datePosted: job.createdAt,
    validThrough: job.expiredAt,
    employmentType:
      job.employmentType === 'PART_TIME'
        ? 'PART_TIME'
        : job.employmentType === 'INTERNSHIP'
        ? 'INTERN'
        : 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.companyName,
      logo: job.companyLogoUrl || (typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : undefined),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.city || 'Toàn quốc',
        addressCountry: 'VN',
      },
    },
    ...(job.salaryFrom || job.salaryTo
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'VND',
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salaryFrom || undefined,
              maxValue: job.salaryTo || undefined,
              unitText: 'MONTH',
            },
          },
        }
      : {}),
  };

  return (
    <div className={styles.jobDetailPage}>
      <SeoHead
        title={`${job.title} — ${job.companyName} | Tuyển dụng HR Portal`}
        description={`Tuyển dụng ${job.title} tại ${job.companyName} (${job.city || 'Toàn quốc'}). Mức lương: ${formatSalary(job.salaryFrom, job.salaryTo)}. Hạn nộp: ${job.expiredAt ? new Date(job.expiredAt).toLocaleDateString('vi-VN') : 'Đang tuyển'}.`}
        ogType="article"
        ogImage={job.companyLogoUrl || '/logo.png'}
        jsonLd={jobPostingJsonLd}
      />

      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumbs} aria-label="Đường dẫn trang">
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={13} className={styles.separator} />
        <Link to="/jobs">Việc làm</Link>
        {job.category && (
          <>
            <ChevronRight size={13} className={styles.separator} />
            <Link to={`/jobs?industry=${encodeURIComponent(job.categoryCode || job.category)}`}>
              {job.category}
            </Link>
          </>
        )}
        <ChevronRight size={13} className={styles.separator} />
        <span className={styles.current}>{job.title}</span>
      </nav>

      {/* Main Grid */}
      <div className={styles.detailGrid}>
        {/* Left Column: Job Details */}
        <div className={styles.mainColumn}>
          {/* Header Card */}
          <div className={styles.headerCard}>
            <div className={styles.companyMetaRow}>
              <div className={styles.logoWrapper}>
                {job.companyLogoUrl && !imgError ? (
                  <img
                    src={job.companyLogoUrl}
                    alt={job.companyName}
                    className={styles.logoImg}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className={styles.logoInitial}>{initial}</span>
                )}
              </div>
              <div className={styles.companyInfo}>
                {job.companyId ? (
                  <Link to={`/companies/${job.companyId}`} className={styles.companyLink}>
                    {job.companyName}
                  </Link>
                ) : (
                  <span className={styles.companyLink}>{job.companyName}</span>
                )}
                <span className={styles.verifiedBadge}>
                  <CheckCircle size={11} /> Đã xác thực doanh nghiệp
                </span>
              </div>
            </div>

            <h1 className={styles.jobTitle}>{job.title}</h1>

            {/* 4 Summary Blocks */}
            <div className={styles.summaryGrid}>
              <div className={styles.summaryBlock}>
                <DollarSign size={18} className={styles.blockIcon} />
                <div className={styles.blockText}>
                  <span className={styles.blockLabel}>Mức lương</span>
                  <span className={`${styles.blockValue} ${styles.salary}`}>
                    {formatSalary(job.salaryFrom, job.salaryTo)}
                  </span>
                </div>
              </div>

              <div className={styles.summaryBlock}>
                <MapPin size={18} className={styles.blockIcon} />
                <div className={styles.blockText}>
                  <span className={styles.blockLabel}>Địa điểm</span>
                  <span className={styles.blockValue} title={job.city || 'Toàn quốc'}>
                    {job.city || 'Toàn quốc'}
                  </span>
                </div>
              </div>

              <div className={styles.summaryBlock}>
                <Briefcase size={18} className={styles.blockIcon} />
                <div className={styles.blockText}>
                  <span className={styles.blockLabel}>Kinh nghiệm</span>
                  <span className={styles.blockValue}>
                    {job.experienceLevel || 'Không yêu cầu'}
                  </span>
                </div>
              </div>

              <div className={styles.summaryBlock}>
                <Clock size={18} className={styles.blockIcon} />
                <div className={styles.blockText}>
                  <span className={styles.blockLabel}>Hạn nộp hồ sơ</span>
                  <span className={styles.blockValue}>
                    {getDaysRemainingText(job.expiredAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Fit Banner */}
            <div className={styles.aiFitBanner}>
              <div className={styles.aiFitText}>
                <Sparkles size={16} className={styles.aiFitIcon} />
                <span>
                  Đánh giá mức độ phù hợp giữa CV của bạn và công việc này bằng Trợ lý AI
                </span>
              </div>
              <button
                type="button"
                className={styles.aiFitBtn}
                onClick={handleAnalyzeJobFit}
              >
                Phân tích CV ngay
              </button>
            </div>
          </div>

          {/* Prose Content Card */}
          <div className={styles.proseCard}>
            {job.description && (
              <section className={styles.contentSection}>
                <h2>
                  <Briefcase size={16} /> Mô tả công việc
                </h2>
                <div className={styles.sectionBody}>{job.description}</div>
              </section>
            )}

            {job.requirements && (
              <section className={styles.contentSection}>
                <h2>
                  <CheckCircle size={16} /> Yêu cầu ứng viên
                </h2>
                <div className={styles.sectionBody}>{job.requirements}</div>
              </section>
            )}

            {job.benefits && (
              <section className={styles.contentSection}>
                <h2>
                  <DollarSign size={16} /> Quyền lợi phúc lợi
                </h2>
                <div className={styles.sectionBody}>{job.benefits}</div>
              </section>
            )}

            <section className={styles.contentSection}>
              <h2>
                <MapPin size={16} /> Địa điểm & Thời gian làm việc
              </h2>
              <div className={styles.sectionBody}>
                <p>• Địa điểm: {job.city || 'Toàn quốc'}</p>
                <p>• Chế độ làm việc: {job.workMode || 'Tại văn phòng'}</p>
                <p>• Hình thức làm việc: {job.employmentType || 'Toàn thời gian'}</p>
                <p>
                  • Ngày đăng: {new Date(job.createdAt).toLocaleDateString('vi-VN')} — Hạn nộp:{' '}
                  {job.expiredAt ? new Date(job.expiredAt).toLocaleDateString('vi-VN') : 'Đang tuyển'}
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Right Sticky Sidebar */}
        <aside className={styles.sidebarColumn} aria-label="Thao tác ứng tuyển">
          {/* Action Card */}
          <div className={styles.actionCard}>
            {hasApplied ? (
              <button type="button" disabled className={styles.appliedStateBtn}>
                <CheckCircle size={16} /> Đã nộp hồ sơ ứng tuyển
              </button>
            ) : (
              <button
                type="button"
                className={styles.mainApplyBtn}
                onClick={handleOpenApplyModal}
              >
                Ứng tuyển ngay
              </button>
            )}

            <div className={styles.secondaryActionRow}>
              {!isEmployer && (
                <button
                  type="button"
                  className={`${styles.secondaryActionBtn} ${isSaved ? styles.saved : ''}`}
                  onClick={handleToggleSaveJob}
                  disabled={togglingSave}
                >
                  <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
                  <span>{isSaved ? 'Đã lưu' : 'Lưu tin'}</span>
                </button>
              )}

              <button
                type="button"
                className={styles.secondaryActionBtn}
                onClick={handleShareJob}
                style={{ gridColumn: isEmployer ? 'span 2' : undefined }}
              >
                <Share2 size={14} />
                <span>Chia sẻ tin</span>
              </button>
            </div>
          </div>

          {/* Mini Company Card */}
          <div className={styles.miniCompanyCard}>
            <h3 className={styles.cardTitle}>Thông tin doanh nghiệp</h3>
            <div className={styles.companyBrief}>
              <div className={styles.miniLogo}>
                {job.companyLogoUrl && !imgError ? (
                  <img src={job.companyLogoUrl} alt={job.companyName} />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className={styles.miniInfo}>
                {job.companyId ? (
                  <Link to={`/companies/${job.companyId}`} className={styles.miniName}>
                    {job.companyName}
                  </Link>
                ) : (
                  <span className={styles.miniName}>{job.companyName}</span>
                )}
                <span className={styles.miniIndustry}>
                  {job.category || 'Doanh nghiệp tuyển dụng'} • {job.city || 'Việt Nam'}
                </span>
              </div>
            </div>

            <div className={styles.companyLinkRow}>
              {job.companyId && (
                <>
                  <Link to={`/companies/${job.companyId}`}>
                    <span>Xem hồ sơ công ty</span>
                    <ExternalLink size={12} />
                  </Link>
                  <Link to={`/companies/${job.companyId}/careers`}>
                    <span>Xem cổng tuyển dụng (Careers)</span>
                    <ExternalLink size={12} />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Similar Jobs Card */}
          {similarJobs.length > 0 && (
            <div className={styles.similarJobsCard}>
              <h3 className={styles.cardTitle}>Việc làm tương tự</h3>
              <div className={styles.similarList}>
                {similarJobs.map((simJob) => (
                  <Link
                    key={simJob.id}
                    to={`/jobs/${simJob.id}`}
                    className={styles.similarItem}
                  >
                    <h4 className={styles.similarJobTitle}>{simJob.title}</h4>
                    <p className={styles.similarCompany}>
                      {simJob.companyName} • {simJob.city}
                    </p>
                    <span className={styles.similarSalary}>
                      {formatSalary(simJob.salaryFrom, simJob.salaryTo)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Modals */}
      <ApplyJobModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        job={job}
        cvs={cvs}
        onSubmit={handleSubmitApply}
        submitting={submittingApply}
      />

      <AiJobFitModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        loading={analyzingAi}
        analysis={aiAnalysis}
        jobTitle={job.title}
      />
    </div>
  );
};

export default JobDetailPage;

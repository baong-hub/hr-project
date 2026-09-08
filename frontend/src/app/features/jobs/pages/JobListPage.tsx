import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, DollarSign, Clock, RotateCcw } from 'lucide-react';
import { jobsService } from '../../../core/services/jobs.service';
import { applicationsService } from '../../../core/services/applications.service';
import { cvsService } from '../../../core/services/cvs.service';
import { authService } from '../../../core/services/auth.service';
import { toast } from '../../../core/services/toast.service';
import type { JobDto } from '../../../core/models/job.model';
import styles from './JobsPage.module.scss';

export const JobListPage: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const roles = (user?.roles as string[]) || [];
  const isCandidate = roles.includes('Ứng viên');

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

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (cityFilter) params.city = cityFilter;
      if (salaryFrom) params.salaryFrom = parseFloat(salaryFrom);

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

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleClearFilters = () => {
    setSearch('');
    setCityFilter('');
    setSalaryFrom('');
    setTimeout(() => fetchJobs(), 50);
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
        setShowApplyModal(false);
        setCoverLetter('');
        setApplyingJob(null);
      } else {
        toast.error(res.data?.error?.message || 'Ứng tuyển thất bại.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi gửi đơn ứng tuyển.');
    } finally {
      setSubmittingApply(false);
    }
  };

  const formatSalary = (from?: number, to?: number) => {
    if (!from && !to) return 'Thỏa thuận';
    const fmt = (n: number) => (n / 1000000).toFixed(0) + ' triệu';
    if (from && to) return `${fmt(from)} - ${fmt(to)}`;
    if (from) return `Từ ${fmt(from)}`;
    return `Đến ${fmt(to!)}`;
  };

  return (
    <div className={styles.jobsPage}>
      <div className={styles.titleArea}>
        <div>
          <h1>Khám phá Cơ hội Việc làm IT</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
            Tìm kiếm và ứng tuyển trực tiếp nhanh chóng
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
              Quản lý tin của tôi
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/employer/jobs/new')}
              className={styles.btnPrimary}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              + Đăng tin mới
            </button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <form onSubmit={handleSearchSubmit} className={styles.jobSearchBox}>
        <div className={styles.searchInputs} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <input
            type="text"
            placeholder="Tìm theo tiêu đề công việc, kỹ năng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
            <option value="">Tất cả địa điểm</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="TP. HCM">TP. Hồ Chí Minh</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
          </select>
          <select value={salaryFrom} onChange={(e) => setSalaryFrom(e.target.value)}>
            <option value="">Tất cả mức lương</option>
            <option value="10000000">Trên 10 triệu</option>
            <option value="20000000">Trên 20 triệu</option>
            <option value="30000000">Trên 30 triệu</option>
            <option value="40000000">Trên 40 triệu</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '12px' }}>
          <button type="submit" className={styles.btnPrimary}>
            <Search size={16} /> Tìm kiếm
          </button>
          <button type="button" onClick={handleClearFilters} className={styles.btnSecondary}>
            <RotateCcw size={16} /> Xóa bộ lọc
          </button>
        </div>
      </form>

      {/* Main Content (Split Layout) */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Đang tải danh sách công việc...
        </div>
      ) : error ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-error)' }}>
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Không tìm thấy cơ hội việc làm nào phù hợp.
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
                  <span>Hạn nộp: {new Date(job.expiredAt).toLocaleDateString('vi-VN')}</span>
                  {isCandidate && (
                    <button
                      onClick={(e) => openApplyModal(job, e)}
                      className={styles.btnPrimary}
                      style={{ padding: '4px 10px', fontSize: '11px', borderRadius: 'var(--radius-sm)' }}
                    >
                      Ứng tuyển
                    </button>
                  )}
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
                      <Clock size={14} /> Hạn nộp:{' '}
                      {new Date(activeJob.expiredAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {isCandidate && (
                      <button onClick={(e) => openApplyModal(activeJob, e)} className={styles.btnPrimary}>
                        Ứng tuyển ngay
                      </button>
                    )}
                    <button onClick={() => navigate(`/jobs/${activeJob.id}`)} className={styles.btnSecondary}>
                      Xem chi tiết đầy đủ
                    </button>
                  </div>
                </div>
                <div className={styles.detailBody}>
                  <div className={styles.detailSection}>
                    <h3>Mô tả công việc</h3>
                    <p>{activeJob.description}</p>
                  </div>
                  <div className={styles.detailSection}>
                    <h3>Yêu cầu ứng viên</h3>
                    <p>{activeJob.requirements}</p>
                  </div>
                  {activeJob.benefits && (
                    <div className={styles.detailSection}>
                      <h3>Quyền lợi phúc lợi</h3>
                      <p>{activeJob.benefits}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.noJobSelected}>
                <Briefcase size={48} />
                <p>Chọn một công việc để xem chi tiết</p>
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

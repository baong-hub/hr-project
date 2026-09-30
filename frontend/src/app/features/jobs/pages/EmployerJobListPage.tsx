import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, X, Check, Sparkles, ExternalLink, Star } from 'lucide-react';
import { jobsService } from '../../../core/services/jobs.service';
import { toast } from '../../../core/services/toast.service';
import type { JobDto, JobStatus } from '../../../core/models/job.model';
import { StatusBadge } from '../../../shared/components/status-badge/StatusBadge';
import { PromoteJobModal } from '../components/PromoteJobModal';
import styles from './EmployerJobListPage.module.scss';

export const EmployerJobListPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Promotion Add-on
  const [promotingJob, setPromotingJob] = useState<JobDto | null>(null);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);

  const fetchJobs = async (overrideParams?: { keyword?: string; status?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const kw = overrideParams?.keyword !== undefined ? overrideParams.keyword : keyword;
      const st = overrideParams?.status !== undefined ? overrideParams.status : status;

      const params: any = {
        page,
        pageSize,
      };
      if (kw) params.search = kw.trim();
      if (st) params.status = st;

      const res = await jobsService.getJobs(params);
      if (res.data?.success && res.data.data) {
        setJobs(res.data.data.items || []);
        setTotalItems(res.data.data.meta?.total || 0);
      } else {
        setError(res.data?.error?.message || 'Lỗi khi tải danh sách tin tuyển dụng.');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối hệ thống. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, pageSize, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleClearFilters = () => {
    setKeyword('');
    setStatus('');
    setPage(1);
    fetchJobs({ keyword: '', status: '' });
  };

  const handleDelete = async (id: number, title: string) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa bài đăng [${title}]? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;

    try {
      const res = await jobsService.deleteJob(id);
      if (res.data?.success) {
        toast.success('Xóa tin tuyển dụng thành công!');
        fetchJobs();
      } else {
        toast.error(res.data?.error?.message || 'Không thể xóa tin tuyển dụng.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa tin tuyển dụng.');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: JobStatus) => {
    const nextStatus: JobStatus = currentStatus === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED';
    try {
      const res = await jobsService.updateJobStatus(id, { status: nextStatus });
      if (res.data?.success) {
        toast.success(`Đã cập nhật trạng thái thành công sang [${nextStatus}]!`);
        fetchJobs();
      } else {
        toast.error(res.data?.error?.message || 'Không thể cập nhật trạng thái tin.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật trạng thái tin.');
    }
  };

  const formatSalary = (from?: number, to?: number) => {
    if (!from && !to) return 'Thỏa thuận';
    if (from && !to) return `Từ ${from.toLocaleString('vi-VN')} đ`;
    if (!from && to) return `Đến ${to.toLocaleString('vi-VN')} đ`;
    return `${from?.toLocaleString('vi-VN')} - ${to?.toLocaleString('vi-VN')} đ`;
  };



  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div className={styles.container}>
      {/* Title Area */}
      <div className={styles.titleArea}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý tin tuyển dụng</h1>
          <p className={styles.pageSubtitle}>
            Đăng tin tuyển dụng và quản lý hồ sơ ứng viên của doanh nghiệp
          </p>
        </div>
        <div className={styles.titleActions}>
          <button 
            type="button" 
            onClick={() => navigate('/employer/candidates')} 
            className={styles.btnSecondaryAction}
            title="Tìm kiếm ứng viên IT chủ động với bộ lọc nâng cao"
          >
            Săn ứng viên (Talent Pool)
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/employer/assessments')} 
            className={styles.btnSecondaryAction}
            title="Ngân hàng đề thi trắc nghiệm & đánh giá năng lực online"
          >
            Đề thi năng lực
          </button>
          <button 
            type="button" 
            onClick={() => {
              const compId = jobs[0]?.companyId || 1;
              navigate(`/companies/${compId}/careers`);
            }} 
            className={styles.btnSecondaryAction}
            title="Xem Cổng tuyển dụng thương hiệu cao cấp của công ty"
          >
            Cổng Careers Portal
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/jobs?view=public')} 
            className={styles.btnSecondaryAction}
            title="Xem danh sách việc làm hiển thị cho ứng viên"
          >
            Xem việc làm trên sàn
          </button>
          <button onClick={() => navigate('/employer/jobs/new')} className={styles.btnPrimaryAction}>
            Đăng tin mới
          </button>
        </div>
      </div>

      {/* Modern Ecosystem Highlights Banner */}
      <div className={styles.ecosystemBanner}>
        <div>
          <div className={styles.bannerPill}>
            HỆ SINH THÁI TUYỂN DỤNG THÔNG MINH MỚI
          </div>
          <h3 className={styles.bannerHeading}>
            AI Copilot • Săn Ứng Viên Chủ Động • Đánh Giá Năng Lực • Cổng Thương Hiệu Doanh Nghiệp
          </h3>
          <p className={styles.bannerText}>
            Tự động sinh JD bằng AI, sàng lọc ứng viên thông minh, tạo bài thi trắc nghiệm online và phát hành Thư mời nhận việc (Offer Letter) ngay trên hệ thống.
          </p>
        </div>
        <div className={styles.bannerButtons}>
          <button
            type="button"
            onClick={() => navigate('/employer/candidates')}
            className={styles.btnPrimaryAction}
          >
            Săn ứng viên Talent Pool
          </button>
          <button
            type="button"
            onClick={() => navigate('/employer/assessments')}
            className={styles.btnSecondaryAction}
          >
            Ngân hàng đề thi
          </button>
          <button
            type="button"
            onClick={() => {
              const compId = jobs[0]?.companyId || 1;
              navigate(`/companies/${compId}/careers`);
            }}
            className={styles.btnSecondaryAction}
          >
            Cổng Careers Portal
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <form onSubmit={handleSearch} className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, mã tin..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Nháp</option>
            <option value="PENDING_REVIEW">Chờ duyệt</option>
            <option value="PUBLISHED">Đang tuyển</option>
            <option value="PAUSED">Tạm dừng</option>
            <option value="CLOSED">Đã đóng</option>
            <option value="EXPIRED">Hết hạn</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
        <div className={styles.filterActions}>
          <button type="submit" className={styles.btnPrimaryAction}>
            Tìm kiếm
          </button>
          <button type="button" onClick={handleClearFilters} className={styles.btnSecondaryAction}>
            Xóa bộ lọc
          </button>
        </div>
      </form>

      {/* Data Table Area */}
      {loading ? (
        <div className={styles.tableCard}>
          <div className={styles.statusMessage}>Đang tải dữ liệu tin tuyển dụng...</div>
        </div>
      ) : error ? (
        <div className={styles.tableCard}>
          <div className={`${styles.statusMessage} ${styles.error}`}>{error}</div>
        </div>
      ) : jobs.length === 0 ? (
        <div className={styles.tableCard}>
          <div className={`${styles.statusMessage} ${styles.muted}`}>Doanh nghiệp của bạn chưa đăng tin tuyển dụng nào.</div>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th className={styles.stickyActionTh}>Hành động</th>
                  <th>Mã tin</th>
                  <th>Tiêu đề tin tuyển dụng</th>
                  <th className={styles.alignRight}>Mức lương</th>
                  <th className={styles.alignRight}>Ngày đăng</th>
                  <th className={styles.alignRight}>Hạn nộp</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    {/* Sticky Action Column */}
                    <td className={styles.stickyActionTd}>
                      <div className={styles.actionBtns}>
                        <button
                          onClick={() => navigate(`/employer/applications?jobId=${job.id}`)}
                          className={`${styles.actionBtn} ${styles.actionBtnAi}`}
                          title="Xem hồ sơ ứng viên & Phân tích AI Match Score"
                        >
                          <Sparkles size={14} />
                        </button>
                        <button
                          onClick={() => { setPromotingJob(job); setIsPromoteModalOpen(true); }}
                          className={`${styles.actionBtn} ${styles.actionBtnPromote}`}
                          title="Đẩy tin / Ghim VIP (Pay-per-job)"
                        >
                          <Star size={14} fill={job.isFeatured ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => navigate(`/companies/${job.companyId || 1}/careers`)}
                          className={`${styles.actionBtn} ${styles.actionBtnCareers}`}
                          title="Xem Cổng tuyển dụng thương hiệu (Careers Portal)"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}
                          className={styles.actionBtn}
                          title="Sửa tin đăng"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(job.id, job.status)}
                          className={styles.actionBtn}
                          title={job.status === 'PUBLISHED' ? 'Tạm dừng tin' : 'Bật lại tin'}
                        >
                          {job.status === 'PUBLISHED' ? <X size={14} /> : <Check size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(job.id, job.title)}
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          title="Xóa tin đăng (Soft Delete)"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className={styles.jobCodeLink}
                      >
                        JOB-{String(job.id).padStart(4, '0')}
                      </span>
                    </td>
                    <td>
                      <div>{job.title}</div>
                      {(job.isFeatured || job.isUrgent) && (
                        <div className={styles.jobBadgeRow}>
                          {job.isFeatured && (
                            <span className={styles.vipBadge}>
                              VIP NỔI BẬT
                            </span>
                          )}
                          {job.isUrgent && (
                            <span className={styles.urgentBadge}>
                              TUYỂN GẤP
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className={styles.salaryCol}>
                      {formatSalary(job.salaryFrom, job.salaryTo)}
                    </td>
                    <td className={styles.alignRight}>
                      {new Date(job.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className={styles.alignRight}>
                      {new Date(job.expiredAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <StatusBadge status={job.status} type="job" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles.paginationArea}>
            <div className={styles.paginationInfo}>
              Xem{' '}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className={styles.pageSizeSelect}
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>{' '}
              / {totalItems} bản ghi
            </div>
            
            {totalPages > 1 && (
              <div className={styles.pageBtnGroup}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={styles.pageBtn}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ''}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={styles.pageBtn}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Promote Job Modal */}
      <PromoteJobModal
        job={promotingJob}
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        onSuccess={() => fetchJobs()}
      />
    </div>
  );
};

export default EmployerJobListPage;

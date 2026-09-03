import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, Search, RotateCcw, X, Check } from 'lucide-react';
import { jobsService } from '../../../core/services/jobs.service';
import { toast } from '../../../core/services/toast.service';
import type { JobDto, JobStatus } from '../../../core/models/job.model';
import styles from './JobsPage.module.scss';

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

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        pageSize,
      };
      if (keyword) params.search = keyword;
      if (status) params.status = status;

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
  }, [page, pageSize]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleClearFilters = () => {
    setKeyword('');
    setStatus('');
    setPage(1);
    setTimeout(() => fetchJobs(), 50);
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
      toast.error('Lỗi kết nối khi xóa tin tuyển dụng.');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: JobStatus) => {
    const nextStatus: JobStatus = currentStatus === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED';
    const actionText = nextStatus === 'PUBLISHED' ? 'mở tuyển dụng' : 'tạm dừng nhận hồ sơ';
    
    const confirmed = window.confirm(`Bạn có muốn ${actionText} tin tuyển dụng này?`);
    if (!confirmed) return;

    try {
      const res = await jobsService.updateJobStatus(id, { status: nextStatus });
      if (res.data?.success) {
        toast.success('Cập nhật trạng thái thành công!');
        fetchJobs();
      } else {
        toast.error(res.data?.error?.message || 'Cập nhật thất bại.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật trạng thái.');
    }
  };

  const formatSalary = (from?: number, to?: number) => {
    if (!from && !to) return 'Thỏa thuận';
    const fmt = (n: number) => (n / 1000000).toFixed(0) + 'tr';
    if (from && to) return `${fmt(from)} - ${fmt(to)}`;
    if (from) return `Từ ${fmt(from)}`;
    return `Đến ${fmt(to!)}`;
  };

  const getStatusBadgeClass = (s: JobStatus) => {
    switch (s) {
      case 'PUBLISHED':
        return 'status-green'; // Custom classes mapped in stylesheet
      case 'PENDING_REVIEW':
        return 'status-amber';
      case 'REJECTED':
      case 'CLOSED':
        return 'status-red';
      default:
        return 'status-gray';
    }
  };

  const getStatusText = (s: JobStatus) => {
    switch (s) {
      case 'PUBLISHED':
        return 'Đang tuyển';
      case 'PENDING_REVIEW':
        return 'Chờ duyệt';
      case 'REJECTED':
        return 'Từ chối';
      case 'CLOSED':
        return 'Đã đóng';
      case 'EXPIRED':
        return 'Hết hạn';
      case 'PAUSED':
        return 'Tạm dừng';
      default:
        return 'Nháp';
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className={styles.jobsPage}>
      {/* Title Area */}
      <div className={styles.titleArea}>
        <div>
          <h1>Quản lý tin tuyển dụng</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
            Đăng tin tuyển dụng và quản lý hồ sơ ứng viên của doanh nghiệp
          </p>
        </div>
        <div className={styles.titleActions}>
          <button onClick={() => navigate('/employer/jobs/new')} className={styles.btnPrimary}>
            <Plus size={16} /> Đăng tin mới
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <form onSubmit={handleSearch} className={styles.jobSearchBox}>
        <div className={styles.searchInputs} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, mã tin..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
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
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '12px' }}>
          <button type="submit" className={styles.btnPrimary}>
            <Search size={16} /> Tìm kiếm
          </button>
          <button type="button" onClick={handleClearFilters} className={styles.btnSecondary}>
            <RotateCcw size={16} /> Xóa bộ lọc
          </button>
        </div>
      </form>

      {/* Data Table Area */}
      {loading ? (
        <div className={styles.tableCard} style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Đang tải dữ liệu tin tuyển dụng...
        </div>
      ) : error ? (
        <div className={styles.tableCard} style={{ padding: '60px', textAlign: 'center', color: 'var(--color-error)' }}>
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className={styles.tableCard} style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Doanh nghiệp của bạn chưa đăng tin tuyển dụng nào.
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--color-bg-subtle)', width: '112px', zIndex: 10 }}>⚙ Hành động</th>
                  <th>Mã tin</th>
                  <th>Tiêu đề tin tuyển dụng</th>
                  <th style={{ textAlign: 'right' }}>Mức lương</th>
                  <th style={{ textAlign: 'right' }}>Ngày đăng</th>
                  <th style={{ textAlign: 'right' }}>Hạn nộp</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    {/* Sticky Action Column */}
                    <td style={{ position: 'sticky', left: 0, background: 'var(--color-bg-card)', zIndex: 5, borderRight: '1px solid var(--color-border-light)' }}>
                      <div className={styles.actionBtns}>
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
                        style={{ color: 'var(--color-brand-primary)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                      >
                        JOB-{String(job.id).padStart(4, '0')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{job.title}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#2e7d32' }}>
                      {formatSalary(job.salaryFrom, job.salaryTo)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {new Date(job.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {new Date(job.expiredAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(job.status)}`}>
                        {getStatusText(job.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--color-border-default)', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Xem{' '}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                style={{ padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)' }}
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>{' '}
              / {totalItems} bản ghi
            </div>
            
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={styles.btnSecondary}
                  style={{ padding: '6px 12px' }}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={page === p ? styles.btnPrimary : styles.btnSecondary}
                    style={{ padding: '6px 12px', border: page === p ? 'none' : '1px solid var(--color-border-default)' }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={styles.btnSecondary}
                  style={{ padding: '6px 12px' }}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

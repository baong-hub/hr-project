import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, DollarSign, Clock, Calendar } from 'lucide-react';
import { jobsService } from '../../../core/services/jobs.service';
import { cvsService } from '../../../core/services/cvs.service';
import { applicationsService } from '../../../core/services/applications.service';
import { authService } from '../../../core/services/auth.service';
import { toast } from '../../../core/services/toast.service';
import type { JobDto } from '../../../core/models/job.model';
import styles from './JobsPage.module.scss';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = authService.getUser();
  const roles = (user?.roles as string[]) || [];
  const isCandidate = roles.includes('Ứng viên');

  // State
  const [job, setJob] = useState<JobDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [cvs, setCvs] = useState<any[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<number | ''>('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await jobsService.getJobById(Number(id));
        if (res.data?.success && res.data.data) {
          setJob(res.data.data);
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

  const handleApply = async () => {
    if (!selectedCvId) {
      toast.error('Vui lòng chọn CV để ứng tuyển.');
      return;
    }
    setSubmittingApply(true);
    try {
      const res = await applicationsService.submitApplication({
        jobId: job!.id,
        candidateCvId: Number(selectedCvId),
        coverLetter
      });
      if (res.data?.success) {
        toast.success('Ứng tuyển thành công!');
        setShowApplyModal(false);
        setCoverLetter('');
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

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Đang tải thông tin chi tiết công việc...
      </div>
    );
  }

  if (error || !job) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-error)', marginBottom: '16px' }}>{error || 'Công việc không tồn tại.'}</p>
        <button onClick={() => navigate('/jobs')} className={styles.btnSecondary}>
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className={styles.jobsPage} style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '12px' }}>
        <button onClick={() => navigate(-1)} className={styles.btnSecondary}>
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>

      <div className={styles.jobDetailColumn}>
        <div className={styles.detailHeader}>
          <div className={styles.companyBadge} style={{ marginBottom: '12px' }}>
            {job.companyLogoUrl ? (
              <img src={job.companyLogoUrl} alt="Logo" className={styles.companyLogo} style={{ width: '48px', height: '48px' }} />
            ) : (
              <div className={styles.companyLogo} style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-subtle)' }}>No Logo</div>
            )}
            <div>
              <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{job.companyName}</span>
              <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Nhà tuyển dụng chuyên nghiệp</p>
            </div>
          </div>

          <h1 className={styles.detailHeaderTitle} style={{ fontSize: 'var(--font-size-2xl)' }}>{job.title}</h1>

          <div className={styles.detailHeaderMeta} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', margin: '16px 0' }}>
            <div className={styles.metaItem}>
              <MapPin size={16} /> <strong>Địa điểm:</strong> {job.city}
            </div>
            <div className={styles.metaItem}>
              <DollarSign size={16} /> <strong>Mức lương:</strong>{' '}
              <span className={styles.salaryText}>{formatSalary(job.salaryFrom, job.salaryTo)}</span>
            </div>
            <div className={styles.metaItem}>
              <Calendar size={16} /> <strong>Ngày đăng:</strong>{' '}
              {new Date(job.createdAt).toLocaleDateString('vi-VN')}
            </div>
            <div className={styles.metaItem}>
              <Clock size={16} /> <strong>Hạn nộp:</strong>{' '}
              {new Date(job.expiredAt).toLocaleDateString('vi-VN')}
            </div>
          </div>

          {isCandidate && (
            <div style={{ marginTop: '24px' }}>
              <button onClick={() => { setShowApplyModal(true); fetchCvs(); }} className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                Nộp đơn ứng tuyển ngay
              </button>
            </div>
          )}
        </div>

        <div className={styles.detailBody}>
          <div className={styles.detailSection}>
            <h3>Mô tả công việc</h3>
            <p>{job.description}</p>
          </div>

          <div className={styles.detailSection}>
            <h3>Yêu cầu ứng viên</h3>
            <p>{job.requirements}</p>
          </div>

          {job.benefits && (
            <div className={styles.detailSection}>
              <h3>Quyền lợi phúc lợi</h3>
              <p>{job.benefits}</p>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ padding: '24px', gap: '16px' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Ứng tuyển: {job.title}</h2>
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

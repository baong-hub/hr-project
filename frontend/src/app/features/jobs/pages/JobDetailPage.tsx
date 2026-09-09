import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Clock, Calendar, Sparkles, CheckCircle, AlertCircle, Lightbulb, X } from 'lucide-react';
import { jobsService } from '../../../core/services/jobs.service';
import { cvsService } from '../../../core/services/cvs.service';
import { applicationsService } from '../../../core/services/applications.service';
import { savedJobService } from '../../../core/services/saved-job.service';
import { authService } from '../../../core/services/auth.service';
import { aiService, type JobFitAnalysisResult } from '../../../core/services/ai.service';
import { toast } from '../../../core/services/toast.service';
import type { JobDto } from '../../../core/models/job.model';
import styles from './JobsPage.module.scss';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = authService.getUser();
  const roles = (user?.roles as string[]) || [];
  const userRole = user?.role || user?.accountType || '';
  const isEmployer = roles.includes('Nhà tuyển dụng') || userRole === 'EMPLOYER' || userRole === 'Company' || userRole === 'Admin' || userRole === 'ADMIN';
  const isCandidate = !isEmployer;

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

  // AI Job Fit Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<JobFitAnalysisResult | null>(null);

  // Saved Job state
  const [isSaved, setIsSaved] = useState(false);
  const [togglingSave, setTogglingSave] = useState(false);

  // Applied state (prevent duplicate applications)
  const [hasApplied, setHasApplied] = useState(false);

  const handleAnalyzeJobFit = async () => {
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
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi kết nối với Trợ lý AI.');
    } finally {
      setAnalyzingAi(false);
    }
  };

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
        setHasApplied(true);
        setShowApplyModal(false);
        setCoverLetter('');
      } else {
        toast.error(res.data?.error?.message || 'Ứng tuyển thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.error?.message || err?.message || 'Lỗi khi gửi đơn ứng tuyển.';
      toast.error(errMsg);
      if (errMsg.includes('đã nộp đơn') || errMsg.includes('already applied')) {
        setHasApplied(true);
        setShowApplyModal(false);
      }
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

  // Fetch saved status for this job
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!authService.isAuthenticated() || isEmployer || !id) return;
      try {
        const res = await savedJobService.getSavedJobs({ page: 1, pageSize: 200 });
        if (res.data?.success && res.data.data) {
          const raw = res.data.data;
          const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
          const saved = items.some((item: any) => item.jobId === Number(id));
          setIsSaved(saved);
        }
      } catch (err) {
        console.error('Failed to check saved status:', err);
      }
    };
    checkSavedStatus();
  }, [id, isEmployer]);

  // Check if already applied
  useEffect(() => {
    const checkAppliedStatus = async () => {
      if (!authService.isAuthenticated() || isEmployer || !id) return;
      try {
        const res = await applicationsService.getApplications();
        if (res.data?.success && res.data.data) {
          const raw = res.data.data;
          const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
          const applied = items.some((item: any) => item.jobId === Number(id));
          setHasApplied(applied);
        }
      } catch (err) {
        console.error('Failed to check applied status:', err);
      }
    };
    checkAppliedStatus();
  }, [id, isEmployer]);

  const toggleSaveJob = async () => {
    if (!job || !isCandidate) return;
    setTogglingSave(true);
    const wasSaved = isSaved;
    setIsSaved(!wasSaved); // Optimistic
    try {
      const res = await savedJobService.toggleSave(job.id);
      if (res.data?.success && res.data.data) {
        setIsSaved(res.data.data.isSaved);
        toast.success(res.data.data.isSaved ? 'Đã lưu việc làm!' : 'Đã bỏ lưu việc làm.');
      }
    } catch (err) {
      setIsSaved(wasSaved); // Rollback
      toast.error('Lỗi khi lưu việc làm.');
    } finally {
      setTogglingSave(false);
    }
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
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className={styles.jobsPage} style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '12px' }}>
        <button onClick={() => navigate(-1)} className={styles.btnSecondary}>
          Quay lại
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

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              type="button"
              onClick={handleAnalyzeJobFit} 
              className={styles.btnSecondary} 
              style={{ 
                flex: '1 1 180px', 
                justifyContent: 'center', 
                padding: '12px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
                border: '1px solid #c7d2fe',
                color: '#4338ca',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Phân tích độ phù hợp hồ sơ
            </button>
            {isCandidate && (
              <button
                type="button"
                onClick={toggleSaveJob}
                disabled={togglingSave}
                className={styles.btnSecondary}
                style={{
                  flex: '0 0 auto',
                  justifyContent: 'center',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 600,
                  color: isSaved ? '#ef4444' : undefined,
                  borderColor: isSaved ? '#fecaca' : undefined,
                  background: isSaved ? '#fef2f2' : undefined,
                  transition: 'all 0.2s ease',
                }}
              >
                {isSaved ? 'Đã lưu' : 'Lưu việc làm'}
              </button>
            )}
            {isCandidate && (
              hasApplied ? (
                <button 
                  disabled
                  className={styles.btnSecondary} 
                  style={{
                    flex: '1 1 180px',
                    justifyContent: 'center',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    background: '#ecfdf5',
                    color: '#059669',
                    borderColor: '#a7f3d0',
                    fontWeight: 600,
                    cursor: 'not-allowed',
                    opacity: 0.9,
                  }}
                >
                  Đã ứng tuyển vị trí này
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => { setShowApplyModal(true); fetchCvs(); }} 
                  className={styles.btnPrimary} 
                  style={{ flex: '1 1 180px', justifyContent: 'center', padding: '12px' }}
                >
                  Nộp đơn ứng tuyển ngay
                </button>
              )
            )}
          </div>
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

      {/* AI Job Fit Analysis Modal */}
      {showAiModal && (
        <div className={styles.modalOverlay} style={{ backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.65)' }}>
          <div className={styles.modalContent} style={{ maxWidth: '680px', width: '92%', maxHeight: '88vh', overflowY: 'auto', padding: '24px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>Đánh Giá Độ Phù Hợp AI</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Phân tích hồ sơ CV đối chiếu với vị trí: {job.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAiModal(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {analyzingAi ? (
              <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>AI Đang Phân Tích Kỹ Năng & Kinh Nghiệm...</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>Hệ thống đang quét các từ khóa chuyên môn, yêu cầu năng lực và tính toán độ tương thích chuẩn xác nhất.</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            ) : aiAnalysis ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Score Banner */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '16px 20px', 
                  background: aiAnalysis.matchScore >= 80 ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : aiAnalysis.matchScore >= 60 ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  borderRadius: '12px',
                  border: `1px solid ${aiAnalysis.matchScore >= 80 ? '#a7f3d0' : aiAnalysis.matchScore >= 60 ? '#bfdbfe' : '#fde68a'}`
                }}>
                  <div>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '4px 10px', 
                      borderRadius: '999px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      textTransform: 'uppercase',
                      backgroundColor: aiAnalysis.matchScore >= 80 ? '#059669' : aiAnalysis.matchScore >= 60 ? '#2563eb' : '#d97706',
                      color: '#ffffff',
                      marginBottom: '6px'
                    }}>
                      {aiAnalysis.matchLevel}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                      Độ Phù Hợp Tổng Quan: {aiAnalysis.matchScore}%
                    </h3>
                  </div>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    background: '#ffffff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    color: aiAnalysis.matchScore >= 80 ? '#059669' : aiAnalysis.matchScore >= 60 ? '#2563eb' : '#d97706'
                  }}>
                    {aiAnalysis.matchScore}%
                  </div>
                </div>

                {/* Summary */}
                <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', borderLeft: '4px solid #6366f1' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>
                    <strong>Nhận định:</strong> {aiAnalysis.summary}
                  </p>
                </div>

                {/* Strengths & Missing Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {/* Strengths */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#059669' }}>
                      <CheckCircle size={18} />
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Điểm mạnh nổi bật</h4>
                    </div>
                    {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                        {aiAnalysis.strengths.map((str, idx) => (
                          <li key={idx} style={{ marginBottom: '6px' }}>{str}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Chưa phát hiện điểm mạnh cụ thể từ hồ sơ.</p>
                    )}
                  </div>

                  {/* Missing skills */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#d97706' }}>
                      <AlertCircle size={18} />
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Kỹ năng nên bổ sung</h4>
                    </div>
                    {aiAnalysis.missingSkills && aiAnalysis.missingSkills.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                        {aiAnalysis.missingSkills.map((sk, idx) => (
                          <li key={idx} style={{ marginBottom: '6px' }}>{sk}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#059669' }}>Hồ sơ đáp ứng trọn vẹn yêu cầu công việc!</p>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                  <div style={{ background: '#fdf4ff', border: '1px solid #f0abfc', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#a21caf' }}>
                      <Lightbulb size={18} />
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Lời khuyên từ AI để tăng cơ hội trúng tuyển</h4>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                      {aiAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button 
                    onClick={() => setShowAiModal(false)} 
                    className={styles.btnSecondary}
                    style={{ padding: '10px 20px' }}
                  >
                    Đóng
                  </button>
                  {isCandidate && (
                    <button 
                      onClick={() => {
                        setShowAiModal(false);
                        setShowApplyModal(true);
                        fetchCvs();
                      }} 
                      className={styles.btnPrimary}
                      style={{ padding: '10px 24px' }}
                    >
                      Ứng tuyển ngay vị trí này
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
